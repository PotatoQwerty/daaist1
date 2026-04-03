import { NextResponse } from "next/server";
import { getEventByEventId, getUserClubRole } from "@/lib/supabase/actions";
import { createClient, supabaseServer } from "@/lib/supabase/server";

type CheckInPayload = {
  eventId?: string;
  token?: string;
  participantId?: string;
  method?: "qr" | "manual" | "scanner";
};

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

  const participantLookup = supabaseServer
    .schema("public")
    .from("event_participants")
    .select(
      "id, first_name, last_name, email, phone, registration_number, checked_in_at, check_in_method",
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

  if (participant.checked_in_at) {
    return NextResponse.json(
      {
        message: "Participant already checked in.",
        alreadyCheckedIn: true,
        participant,
      },
      { status: 200 },
    );
  }

  const { data: updatedParticipant, error: updateError } = await supabaseServer
    .schema("public")
    .from("event_participants")
    .update({
      checked_in_at: new Date().toISOString(),
      checked_in_by: user.id,
      check_in_method: method,
    })
    .eq("id", participant.id)
    .select(
      "id, first_name, last_name, email, phone, registration_number, checked_in_at, check_in_method",
    )
    .single();

  if (updateError) {
    console.error("Participant check-in update error:", updateError);
    return NextResponse.json(
      { error: "Unable to complete check-in." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      message: "Participant checked in successfully.",
      alreadyCheckedIn: false,
      participant: updatedParticipant,
    },
    { status: 200 },
  );
}
