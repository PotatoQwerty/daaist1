import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import {
  canAttachParticipantToUser,
  canRevealParticipantCheckInToken,
  getExistingRegistrationMessage,
} from "@/lib/event-pass-access";
import {
  normalizeAttendanceRole,
  EventParticipantExtraData,
  getAllowedStudyYears,
  parseEventExtraData,
} from "@/lib/event-extra";
import { createClient, supabaseServer } from "@/lib/supabase/server";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

type RegistrationPayload = {
  eventId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  university?: string;
  studyYear?: string;
  registrationNumber?: string;
  attendanceRole?: string;
  experienceAnswers?: Array<{
    topic?: string;
    percentage?: number;
  }>;
  yesNoAnswers?: Array<{
    question?: string;
    answer?: boolean;
  }>;
};

type ExistingParticipant = {
  id: string;
  user_id?: string | null;
  email?: string | null;
  registration_number?: string | null;
  check_in_token?: string | null;
};

function normalizeText(value?: string) {
  return value?.trim() || "";
}

async function getPublicEventForRegistration(eventId: string) {
  const { data: event, error: eventError } = await supabaseServer
    .schema("public")
    .from("events")
    .select("id, title, is_public, extra_data")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError) {
    return {
      event: null,
      error: NextResponse.json(
        { error: "Unable to validate the selected event." },
        { status: 500 },
      ),
    };
  }

  if (!event || !event.is_public) {
    return {
      event: null,
      error: NextResponse.json(
        { error: "This event is not available for public registration." },
        { status: 404 },
      ),
    };
  }

  return { event, error: null };
}

async function findExistingParticipantForEvent({
  eventId,
  userId,
  registrationNumber,
  email,
}: {
  eventId: string;
  userId?: string | null;
  registrationNumber?: string;
  email?: string;
}): Promise<{
  data: ExistingParticipant | null;
  error: unknown;
}> {
  const baseQuery = () =>
    supabaseServer
      .schema("public")
      .from("event_participants")
      .select("id, user_id, email, registration_number, check_in_token")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true })
      .limit(1);

  if (userId) {
    const existingByUser = await baseQuery().eq("user_id", userId).maybeSingle();
    if (existingByUser.error || existingByUser.data) {
      return existingByUser;
    }
  }

  if (registrationNumber) {
    const existingByRegistrationNumber = await baseQuery()
      .eq("registration_number", registrationNumber)
      .maybeSingle();

    if (
      existingByRegistrationNumber.error ||
      existingByRegistrationNumber.data
    ) {
      return existingByRegistrationNumber;
    }
  }

  if (email) {
    return baseQuery().eq("email", email).maybeSingle();
  }

  return { data: null, error: null };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = normalizeText(searchParams.get("eventId") || "");
  const email = normalizeText(searchParams.get("email") || "").toLowerCase();
  const registrationNumber = normalizeText(
    searchParams.get("registrationNumber") || "",
  );

  if (!eventId) {
    return NextResponse.json({ error: "Event ID is required." }, { status: 400 });
  }

  const eventLookup = await getPublicEventForRegistration(eventId);
  if (eventLookup.error) {
    return eventLookup.error;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id && !(email && registrationNumber)) {
    return NextResponse.json({ alreadyRegistered: false }, { status: 200 });
  }

  // This reports whether a given email or matricule is registered, so it is
  // a lookup oracle in its own right.
  const limited = enforceRateLimit(request, RATE_LIMITS.eventRegister, {
    bucket: "event-register-check",
    userId: user?.id ?? null,
  });
  if (limited) return limited;

  const {
    data: existingParticipant,
    error: existingParticipantError,
  } = await findExistingParticipantForEvent({
    eventId,
    userId: user?.id ?? null,
    registrationNumber,
    email,
  });

  if (existingParticipantError) {
    console.error("Participant precheck error:", existingParticipantError);
    return NextResponse.json(
      { error: "Unable to verify your registration right now." },
      { status: 500 },
    );
  }

  if (!existingParticipant?.id) {
    return NextResponse.json({ alreadyRegistered: false }, { status: 200 });
  }

  /* This handler is strictly read-only.

     It used to write: it minted a check_in_token onto rows that lacked one,
     and it bound `user_id` to the caller. Because the auth cookie is
     SameSite=Lax, cookies ARE sent on a cross-site top-level navigation, so
     a GET that mutates is reachable from an attacker's page - and a GET that
     mutates is also cacheable and prefetchable, which browsers and proxies
     are entitled to do on their own.

     The identity rules are unchanged; only the writes are gone. Both writes
     still happen in POST, which is where the form sends people anyway. */
  const participantIdentity = {
    userId: user?.id ?? null,
    email: user?.email ?? email,
    registrationNumber,
  };
  const canRevealToken = canRevealParticipantCheckInToken(
    existingParticipant,
    participantIdentity,
  );
  const message = getExistingRegistrationMessage({
    canRevealToken,
    isSignedIn: Boolean(user?.id),
  });

  // Only ever the stored token. A freshly generated one would not be
  // persisted, so the QR code it produced would not scan.
  const checkInToken = canRevealToken
    ? (existingParticipant.check_in_token ?? null)
    : null;

  return NextResponse.json(
    {
      alreadyRegistered: true,
      message,
      registrationId: existingParticipant.id,
      ...(checkInToken ? { checkInToken } : {}),
    },
    { status: 200 },
  );
}

export async function POST(request: Request) {
  let payload: RegistrationPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const eventId = normalizeText(payload.eventId);
  const firstName = normalizeText(payload.firstName);
  const lastName = normalizeText(payload.lastName);
  const email = normalizeText(payload.email).toLowerCase();
  const phone = normalizeText(payload.phone);
  const university = normalizeText(payload.university);
  const studyYear = normalizeText(payload.studyYear);
  const registrationNumber = normalizeText(payload.registrationNumber);
  const attendanceRole = normalizeAttendanceRole(payload.attendanceRole);
  const experienceAnswers = Array.isArray(payload.experienceAnswers)
    ? payload.experienceAnswers
    : [];
  const yesNoAnswers = Array.isArray(payload.yesNoAnswers)
    ? payload.yesNoAnswers
    : [];

  if (
    !eventId ||
    !firstName ||
    !lastName ||
    !email ||
    !phone ||
    !university ||
    !studyYear ||
    !registrationNumber ||
    !attendanceRole
  ) {
    return NextResponse.json(
      { error: "Please complete every required field." },
      { status: 400 },
    );
  }

  const eventLookup = await getPublicEventForRegistration(eventId);
  if (eventLookup.error) {
    return eventLookup.error;
  }
  const event = eventLookup.event;

  const eventExtraData = parseEventExtraData(event.extra_data);
  const experiencePrompts = eventExtraData.experiencePrompts ?? [];
  const yesNoPrompts = eventExtraData.yesNoQuestions ?? [];
  const allowedStudyYears = getAllowedStudyYears(eventExtraData);
  const shouldCollectExtraAnswers = attendanceRole !== "invited_only";

  if (
    !allowedStudyYears.includes(studyYear as (typeof allowedStudyYears)[number])
  ) {
    return NextResponse.json(
      {
        error: "Your study year is not allowed to register for this event.",
      },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Anonymous sign-ups fall back to IP, so the ceiling is set high enough
  // that a room of students registering off one campus connection is not
  // mistaken for a script.
  const limited = enforceRateLimit(request, RATE_LIMITS.eventRegister, {
    bucket: "event-register",
    userId: user?.id ?? null,
    message: "Too many registration attempts. Please wait and try again.",
  });
  if (limited) return limited;

  const generatedCheckInToken = randomUUID();
  const normalizedExperienceAnswers = shouldCollectExtraAnswers
    ? experiencePrompts.map((prompt) => {
        const submittedAnswer = experienceAnswers.find(
          (answer) =>
            normalizeText(answer.topic).toLowerCase() ===
            prompt.topic.toLowerCase(),
        );

        const percentage =
          typeof submittedAnswer?.percentage === "number"
            ? Math.min(100, Math.max(0, Math.round(submittedAnswer.percentage)))
            : 50;

        return {
          topic: prompt.topic,
          percentage,
        };
      })
    : [];

  const normalizedYesNoAnswers = shouldCollectExtraAnswers
    ? yesNoPrompts.map((prompt) => {
        const submittedAnswer = yesNoAnswers.find(
          (answer) =>
            normalizeText(answer.question).toLowerCase() ===
            prompt.question.toLowerCase(),
        );

        if (typeof submittedAnswer?.answer !== "boolean") {
          return null;
        }

        return {
          question: prompt.question,
          answer: submittedAnswer.answer,
        };
      })
    : [];

  if (
    shouldCollectExtraAnswers &&
    normalizedYesNoAnswers.some((answer) => answer === null)
  ) {
    return NextResponse.json(
      { error: "Please answer every yes or no question before submitting." },
      { status: 400 },
    );
  }

  const participantExtraData: EventParticipantExtraData = {};

  participantExtraData.attendanceRole = attendanceRole;

  if (shouldCollectExtraAnswers && normalizedExperienceAnswers.length > 0) {
    participantExtraData.experience = normalizedExperienceAnswers;
  }

  if (shouldCollectExtraAnswers && normalizedYesNoAnswers.length > 0) {
    participantExtraData.yesNo = normalizedYesNoAnswers.filter(
      (
        answer,
      ): answer is NonNullable<(typeof normalizedYesNoAnswers)[number]> =>
        Boolean(answer),
    );
  }

  const participantPayload = {
    event_id: eventId,
    user_id: user?.id ?? null,
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    university,
    study_year: studyYear,
    registration_number: registrationNumber,
    extra_data: participantExtraData,
    check_in_token: generatedCheckInToken,
  };

  const {
    data: existingParticipant,
    error: existingParticipantError,
  } = await findExistingParticipantForEvent({
    eventId,
    userId: user?.id ?? null,
    registrationNumber,
    email,
  });

  if (existingParticipantError) {
    console.error("Participant lookup error:", existingParticipantError);
    return NextResponse.json(
      { error: "Unable to save your registration right now." },
      { status: 500 },
    );
  }

  if (existingParticipant?.id) {
    const participantIdentity = {
      userId: user?.id ?? null,
      email: user?.email ?? email,
      registrationNumber,
    };
    const canRevealToken = canRevealParticipantCheckInToken(
      existingParticipant,
      participantIdentity,
    );
    const canAttachUser = canAttachParticipantToUser(
      existingParticipant,
      participantIdentity,
    );
    const message = getExistingRegistrationMessage({
      canRevealToken,
      isSignedIn: Boolean(user?.id),
    });
    const checkInToken = canRevealToken
      ? existingParticipant.check_in_token || randomUUID()
      : null;
    const updatePayload: {
      check_in_token?: string;
      user_id?: string;
    } = {};

    if (canRevealToken && !existingParticipant.check_in_token && checkInToken) {
      updatePayload.check_in_token = checkInToken;
    }

    if (canAttachUser && user?.id) {
      updatePayload.user_id = user.id;
    }

    if (Object.keys(updatePayload).length > 0) {
      const { error: updateError } = await supabaseServer
        .schema("public")
        .from("event_participants")
        .update(updatePayload)
        .eq("id", existingParticipant.id);

      if (updateError) {
        console.error("Participant token update error:", updateError);
        return NextResponse.json(
          { error: "Unable to load your existing registration right now." },
          { status: 500 },
        );
      }
    }

    return NextResponse.json(
      {
        error: message,
        message,
        alreadyRegistered: true,
        registrationId: existingParticipant.id,
        ...(checkInToken ? { checkInToken } : {}),
      },
      { status: 409 },
    );
  }

  const { data: createdParticipant, error: insertError } = await supabaseServer
    .schema("public")
    .from("event_participants")
    .insert(participantPayload)
    .select("id")
    .single();

  if (insertError) {
    console.error("Participant insert error:", insertError);

    if (insertError.code === "23505") {
      return NextResponse.json(
        {
          error:
            "A registration already exists for this event with that account or registration number.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Unable to save your registration right now." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      message: "Registration received.",
      registrationId: createdParticipant.id,
      checkInToken: generatedCheckInToken,
    },
    { status: 201 },
  );
}
