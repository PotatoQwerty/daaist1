import { NextResponse } from "next/server";
import {
  getAttendanceRoleLabel,
  parseEventParticipantExtraData,
} from "@/lib/event-extra";
import { getEventByEventId, getUserClubRole } from "@/lib/supabase/actions";
import { createClient, supabaseServer } from "@/lib/supabase/server";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

type CheckInPayload = {
  action?: "check_in" | "cancel";
  eventId?: string;
  token?: string;
  participantId?: string;
  method?: "qr" | "manual" | "scanner";
};

function normalizeParticipant(participant: {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  registration_number: string;
  university?: string | null;
  study_year?: string | null;
  created_at?: string | null;
  checked_in_at?: string | null;
  check_in_method?: string | null;
  extra_data?: unknown;
}) {
  const extraData = parseEventParticipantExtraData(participant.extra_data);
  const participantFields = { ...participant };
  delete participantFields.extra_data;

  return {
    ...participantFields,
    attendance_role: extraData.attendanceRole ?? null,
    attendance_role_label: extraData.attendanceRole
      ? getAttendanceRoleLabel(extraData.attendanceRole)
      : null,
    experience_answers: extraData.experience ?? [],
    yes_no_answers: extraData.yesNo ?? [],
  };
}

export async function POST(request: Request) {
  let payload: CheckInPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const eventId = payload.eventId?.trim();
  const token = payload.token?.trim();
  const participantId = payload.participantId?.trim();
  const action = payload.action === "cancel" ? "cancel" : "check_in";
  const method =
    payload.method === "manual"
      ? "manual"
      : payload.method === "scanner"
        ? "scanner"
        : "qr";

  if (!eventId || (!token && !participantId)) {
    return NextResponse.json(
      { error: "Event ID and participant reference are required." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const event = await getEventByEventId(eventId);

  if (!event?.club_id) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const role = await getUserClubRole(user.id, event.club_id);
  const canManageEvents =
    role === "president" ||
    role === "vice_president" ||
    role === "event_manager";

  if (!canManageEvents) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // High ceiling: staff scan a queue in bursts. This only catches a runaway
  // scanner loop or an attempt to probe check-in tokens.
  const limited = enforceRateLimit(request, RATE_LIMITS.checkIn, {
    bucket: "event-check-in",
    userId: user.id,
  });
  if (limited) return limited;

  const participantLookup = supabaseServer
    .schema("public")
    .from("event_participants")
    .select(
      "id, first_name, last_name, email, phone, university, study_year, registration_number, created_at, checked_in_at, check_in_method, extra_data",
    )
    .eq("event_id", eventId);

  const { data: participant, error: participantError } = token
    ? await participantLookup.eq("check_in_token", token).maybeSingle()
    : await participantLookup.eq("id", participantId!).maybeSingle();

  if (participantError) {
    console.error("Participant check-in lookup error:", participantError);
    return NextResponse.json(
      { error: "Unable to verify this attendee." },
      { status: 500 },
    );
  }

  if (!participant) {
    return NextResponse.json(
      { error: "Participant not found for this event." },
      { status: 404 },
    );
  }

  if (action === "check_in" && participant.checked_in_at) {
    return NextResponse.json(
      {
        message: "Participant already checked in.",
        alreadyCheckedIn: true,
        participant: normalizeParticipant(participant),
      },
      { status: 200 },
    );
  }

  if (action === "cancel" && !participant.checked_in_at) {
    return NextResponse.json(
      {
        message: "Participant is not currently checked in.",
        participant: normalizeParticipant(participant),
      },
      { status: 200 },
    );
  }

  const updatePayload =
    action === "cancel"
      ? {
          checked_in_at: null,
          checked_in_by: null,
          check_in_method: null,
        }
      : {
          checked_in_at: new Date().toISOString(),
          checked_in_by: user.id,
          check_in_method: method,
        };

  const { data: updatedParticipant, error: updateError } = await supabaseServer
    .schema("public")
    .from("event_participants")
    .update(updatePayload)
    .eq("id", participant.id)
    .select(
      "id, first_name, last_name, email, phone, university, study_year, registration_number, created_at, checked_in_at, check_in_method, extra_data",
    )
    .single();

  if (updateError) {
    console.error("Participant check-in update error:", updateError);
    return NextResponse.json(
      {
        error:
          action === "cancel"
            ? "Unable to cancel this check-in."
            : "Unable to complete check-in.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      message:
        action === "cancel"
          ? "Participant check-in cancelled."
          : "Participant checked in successfully.",
      alreadyCheckedIn: false,
      participant: normalizeParticipant(updatedParticipant),
    },
    { status: 200 },
  );
}
