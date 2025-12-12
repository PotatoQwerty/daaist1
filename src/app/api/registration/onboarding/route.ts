import { supabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = session?.user.id;

  const { form } = await request.json();

  const {
    firstname,
    lastname,
    username,
    registration_number,
    studyyear,
    isdaa,
  } = form || {};

  const { data, error } = await supabaseServer
    .from("users")
    .update({
      firstname,
      lastname,
      username,
      studyyear,
      registration_number,
      isdaa,
      onboarded: true,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Username is already taken!" },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ user: data }, { status: 200 });
}
