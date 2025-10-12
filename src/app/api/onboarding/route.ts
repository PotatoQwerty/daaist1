import { supabaseCli } from "../../../../lib/supabase";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { form, id } = await request.json();
  const {
    firstName,
    lastName,
    username,
    registrationNumber,
    studyyear,
    isdaa,
  } = form || {};

  const { data, error } = await supabaseCli
    .from("users")
    .update({
      firstname: firstName,
      lastname: lastName,
      username,
      studyyear,
      registrationNumber,
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
