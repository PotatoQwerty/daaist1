import { NextResponse } from "next/server";
import { createClient, supabaseServer } from "@/lib/supabase/server";
import { getUserClubRole } from "@/lib/supabase/actions";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

const ASSIGNABLE_ROLES = ["member", "vice_president", "event_manager"] as const;

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const club_id = searchParams.get("club_id");

  if (!club_id) {
    return NextResponse.json({ error: "Club ID is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = await getUserClubRole(user.id, club_id);
  if (role !== "president" && role !== "vice_president") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabaseServer
    .from("club_members")
    .select(
      `
    id,
    joined_at,
    role,
    profiles (
      user_id,
      firstname,
      lastname,
      username
    )
  `,
    )
    .eq("club_id", club_id);
  if (error) {
    console.error("Club member list failed:", error);
    return NextResponse.json(
      { error: "Could not load club members" },
      { status: 500 },
    );
  }
  return NextResponse.json({ data }, { status: 200 });
};
export const POST = async (red: Request) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await red.json();
  const role = await getUserClubRole(user.id, body.club_id);
  const isPresident = role === "president" || role === "vice_president";

  if (!isPresident) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = enforceRateLimit(red, RATE_LIMITS.clubMemberWrite, {
    bucket: "club-member-add",
    userId: user.id,
  });
  if (limited) return limited;

  if (!ASSIGNABLE_ROLES.includes(body.role)) {
    return NextResponse.json(
      { error: "Invalid role for club member" },
      { status: 400 },
    );
  }
  const { data, error } = await supabaseServer
    .schema("public")
    .from("club_members")
    .insert({
      club_id: body.club_id,
      user_id: body.user_id,
      role: body.role,
    });
  if (error) {
    console.error("Club member add failed:", error);
    return NextResponse.json(
      { error: "Could not add that member" },
      { status: 500 },
    );
  }
  return NextResponse.json({ data }, { status: 200 });
};

export const DELETE = async (req: Request) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  if (!body.club_id || !body.id) {
    return NextResponse.json(
      { error: "Club ID and member ID are required" },
      { status: 400 },
    );
  }

  const role = await getUserClubRole(user.id, body.club_id);
  const isPresident = role === "president" || role === "vice_president";
  if (!isPresident) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = enforceRateLimit(req, RATE_LIMITS.clubMemberWrite, {
    bucket: "club-member-remove",
    userId: user.id,
  });
  if (limited) return limited;

  const { error } = await supabaseServer
    .schema("public")
    .from("club_members")
    .delete()
    .eq("id", body.id)
    .eq("club_id", body.club_id);

  if (error) {
    console.error("Club member remove failed:", error);
    return NextResponse.json(
      { error: "Could not remove that member" },
      { status: 500 },
    );
  }
  return NextResponse.json({ status: 200 });
};
