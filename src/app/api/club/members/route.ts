import { NextResponse } from "next/server";
import { createClient, supabaseServer } from "@/lib/supabase/server";
import { getUserClubRole } from "@/lib/supabase/actions";

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const club_id = searchParams.get("club_id");

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
  `
    )
    .eq("club_id", club_id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data }, { status: 200 });
};
export const POST = async (red: Request) => {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await red.json();
  const role = await getUserClubRole(session.user.id, body.club_id);
  const isPresident = role === "president";
  if (!isPresident) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (isPresident && body.role === "president") {
    return NextResponse.json(
      { error: "President cannot be added" },
      { status: 401 }
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data }, { status: 200 });
};

export const PATCH = async () => {
  const { error } = await supabaseServer
    .schema("public")
    .from("club_members")
    .update({
      role: "",
    })
    .eq("id", "");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ status: 200 });
};

export const DELETE = async (req: Request) => {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  const role = await getUserClubRole(session.user.id, body.club_id);
  const isPresident = role === "president";
  if (!isPresident) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { error } = await supabaseServer
    .schema("public")
    .from("club_members")
    .delete()
    .eq("id", body.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ status: 200 });
};
