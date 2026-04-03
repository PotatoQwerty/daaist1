import { NextResponse } from "next/server";
import { getEventByEventId, getUserClubRole } from "@/lib/supabase/actions";
import { createClient, supabaseServer } from "@/lib/supabase/server";

function sanitizeSearchTerm(value: string) {
  return value.replace(/[%_,]/g, " ").trim();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("event_id")?.trim();
  const query = sanitizeSearchTerm(searchParams.get("q") || "");

  if (!eventId) {
    return NextResponse.json({ error: "Event ID is required." }, { status: 400 });
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

  let participantsQuery = supabaseServer
    .schema("public")
    .from("event_participants")
    .select(
      "id, first_name, last_name, email, phone, university, study_year, registration_number, created_at, checked_in_at, check_in_method",
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .limit(query ? 50 : 25);

  if (query) {
    participantsQuery = participantsQuery.or(
      [
        `first_name.ilike.%${query}%`,
        `last_name.ilike.%${query}%`,
        `email.ilike.%${query}%`,
        `phone.ilike.%${query}%`,
        `registration_number.ilike.%${query}%`,
      ].join(","),
    );
  }

  const { data, error: participantsError } = await participantsQuery;

  if (participantsError) {
    console.error("Participant search error:", participantsError);
    return NextResponse.json(
      { error: "Unable to fetch participants." },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: data ?? [] }, { status: 200 });
}
