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
      console.error("Participant precheck update error:", updateError);
      return NextResponse.json(
        { error: "Unable to load your existing registration right now." },
        { status: 500 },
      );
    }
  }

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
