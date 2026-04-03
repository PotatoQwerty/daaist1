import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import {
  getAllowedStudyYears,
  EventParticipantExtraData,
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
  experienceAnswers?: Array<{
    topic?: string;
    percentage?: number;
  }>;
};

type ExistingParticipant = {
  id: string;
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
      .select("id, check_in_token")
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

  if (!user?.id && !email && !registrationNumber) {
    return NextResponse.json(
      { alreadyRegistered: false },
      { status: 200 },
    );
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

  const checkInToken = existingParticipant.check_in_token || randomUUID();
  const updatePayload: {
    check_in_token?: string;
    user_id?: string;
  } = {};

  if (!existingParticipant.check_in_token) {
    updatePayload.check_in_token = checkInToken;
  }

  if (user?.id) {
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
      message: "You are already registered for this event.",
      registrationId: existingParticipant.id,
      checkInToken,
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
  const experienceAnswers = Array.isArray(payload.experienceAnswers)
    ? payload.experienceAnswers
    : [];

  if (
    !eventId ||
    !firstName ||
    !lastName ||
    !email ||
    !phone ||
    !university ||
    !studyYear ||
    !registrationNumber
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
  const allowedStudyYears = getAllowedStudyYears(eventExtraData);

  if (!allowedStudyYears.includes(studyYear as (typeof allowedStudyYears)[number])) {
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
  const normalizedExperienceAnswers = experiencePrompts.map((prompt) => {
    const submittedAnswer = experienceAnswers.find(
      (answer) =>
        normalizeText(answer.topic).toLowerCase() === prompt.topic.toLowerCase(),
    );

    const percentage =
      typeof submittedAnswer?.percentage === "number"
        ? Math.min(100, Math.max(0, Math.round(submittedAnswer.percentage)))
        : 50;

    return {
      topic: prompt.topic,
      percentage,
    };
  });

  const participantExtraData: EventParticipantExtraData =
    normalizedExperienceAnswers.length > 0
      ? {
          experience: normalizedExperienceAnswers,
        }
      : {};

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
    const checkInToken = existingParticipant.check_in_token || randomUUID();
    const updatePayload: {
      check_in_token?: string;
      user_id?: string;
    } = {};

    if (!existingParticipant.check_in_token) {
      updatePayload.check_in_token = checkInToken;
    }

    if (user?.id) {
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
        error: "You are already registered for this event.",
        message: "You are already registered for this event.",
        alreadyRegistered: true,
        registrationId: existingParticipant.id,
        checkInToken,
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
