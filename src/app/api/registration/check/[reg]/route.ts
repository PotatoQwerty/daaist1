import { NextResponse } from "next/server";
import { createClient, supabaseServer } from "@/lib/supabase/server";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ reg: string }> }
) {
  const registration_number = (await params).reg;

  // Returns a real student's name for a given registration number, so it
  // stays behind a session. Anonymous callers could otherwise walk
  // sequential registration numbers and rebuild the department roster.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Keyed per account rather than per IP: the whole department shares campus
  // NAT, so an IP budget would count a lab as one caller.
  const limited = enforceRateLimit(request, RATE_LIMITS.registrationLookup, {
    bucket: "registration-check",
    userId: user.id,
    message: "Too many lookups. Please wait a few minutes and try again.",
  });
  if (limited) return limited;

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
    .select("firstname, lastname")
    .eq("registration_number", registration_number)
    .single();

  if (!studiesDaa) {
    return NextResponse.json({ error: "Not a DAA student" }, { status: 404 });
  }
  return NextResponse.json({ data: studiesDaa }, { status: 200 });
}
