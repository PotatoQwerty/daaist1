import { NextResponse } from "next/server";
import {
  getAttendanceRoleLabel,
  parseEventParticipantExtraData,
} from "@/lib/event-extra";
import { getEventByEventId, getUserClubRole } from "@/lib/supabase/actions";
import { createClient, supabaseServer } from "@/lib/supabase/server";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { buildIlikeOrFilter, sanitizeSearchTerm } from "@/lib/search-filter";

/** Columns the participant search looks through. */
const PARTICIPANT_SEARCH_COLUMNS = [
  "first_name",
  "last_name",
  "email",
  "phone",
  "university",
  "study_year",
  "registration_number",
] as const;

async function ensureEventManagerAccess(eventId: string) {
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

  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("event_id")?.trim();
  const query = sanitizeSearchTerm(searchParams.get("q"));

  if (!eventId) {
    return NextResponse.json({ error: "Event ID is required." }, { status: 400 });
  }

  const accessError = await ensureEventManagerAccess(eventId);
  if (accessError) {
    return accessError;
  }

  let participantsQuery = supabaseServer
    .schema("public")
    .from("event_participants")
    .select(
      "id, first_name, last_name, email, phone, university, study_year, registration_number, created_at, checked_in_at, check_in_method, extra_data",
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .limit(query ? 100 : 200);

  // Built through the shared helper, which sanitizes on the way in, so the
  // term cannot contribute PostgREST filter syntax.
  const orFilter = buildIlikeOrFilter(PARTICIPANT_SEARCH_COLUMNS, query);
  if (orFilter) {
    participantsQuery = participantsQuery.or(orFilter);
  }

  const { data, error: participantsError } = await participantsQuery;

  if (participantsError) {
    console.error("Participant search error:", participantsError);
    return NextResponse.json(
      { error: "Unable to fetch participants." },
      { status: 500 },
    );
  }

  const normalizedParticipants = (data ?? []).map((participant) => {
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
  });

  return NextResponse.json({ data: normalizedParticipants }, { status: 200 });
}

export async function DELETE(request: Request) {
  let payload: { eventId?: string; participantId?: string };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const eventId = payload.eventId?.trim();
  const participantId = payload.participantId?.trim();

  if (!eventId || !participantId) {
    return NextResponse.json(
      { error: "Event ID and participant ID are required." },
      { status: 400 },
    );
  }

  const accessError = await ensureEventManagerAccess(eventId);
  if (accessError) {
    return accessError;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const limited = enforceRateLimit(request, RATE_LIMITS.clubEventWrite, {
    bucket: "club-participant-remove",
    userId: user?.id ?? null,
  });
  if (limited) return limited;

  const { data: participant, error: participantError } = await supabaseServer
    .schema("public")
    .from("event_participants")
    .select("id, first_name, last_name")
    .eq("event_id", eventId)
    .eq("id", participantId)
    .maybeSingle();

  if (participantError) {
    console.error("Participant delete lookup error:", participantError);
    return NextResponse.json(
      { error: "Unable to verify this registration." },
      { status: 500 },
    );
  }

  if (!participant) {
    return NextResponse.json(
      { error: "Participant not found for this event." },
      { status: 404 },
    );
  }

  const { error: deleteError } = await supabaseServer
    .schema("public")
    .from("event_participants")
    .delete()
    .eq("event_id", eventId)
    .eq("id", participantId);

  if (deleteError) {
    console.error("Participant delete error:", deleteError);
    return NextResponse.json(
      { error: "Unable to delete this registration." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      message: `Registration removed for ${participant.first_name} ${participant.last_name}.`,
      participantId: participant.id,
    },
    { status: 200 },
  );
}
