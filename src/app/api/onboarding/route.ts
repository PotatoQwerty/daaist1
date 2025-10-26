import { supabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { form, id } = await request.json();
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
    console.log(error);

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ user: data }, { status: 200 });
}
