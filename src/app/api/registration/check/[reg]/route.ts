import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ reg: string }> }
) {
  const registration_number = (await params).reg;

  // first check if the user is from daa by chcecking registration number from supabase
  if (!registration_number) {
    return NextResponse.json(
      { error: "Registration number is required" },
      { status: 400 }
    );
  }

  const { data: studiesDaa, error } = await supabaseServer
    .schema("public")
    .from("students-data")
    .select("*")
    .eq("registration_number", registration_number)
    .single();

  

  if (!studiesDaa) {
    return NextResponse.json({ error: "Not a DAA student" }, { status: 404 });
  }
  return NextResponse.json({ data: studiesDaa }, { status: 200 });
}
