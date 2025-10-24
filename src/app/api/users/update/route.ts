import { NextResponse } from "next/server";
import { supabaseCli } from "../../../../../lib/supabase";
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { registration_number, ...updateFields } = body;

    if (!registration_number) {
      NextResponse.json({ error: "Missing Matricule" }, { staus: 400 });
    }

    const { data, error } = await supabaseCli
      .from("users")
      .update(updateFields)
      .eq("registration_number", registration_number)
      .select();

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: data[0] }, { status: 200 });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
