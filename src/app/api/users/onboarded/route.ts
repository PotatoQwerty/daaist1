import { createClient, supabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ onboarded: null }, { status: 401 });
  }

  const { data: onboarded, error } = await supabaseServer
    .schema("public")
    .from("onboarding_status")
    .select("onboarded")
    .eq("user_id", user.id);

  if (error) {
    console.error("Onboarding status lookup failed:", error);
    return NextResponse.json(
      { message: "Could not check onboarding status" },
      { status: 500 }
    );
  }

  return NextResponse.json({ onboarded: onboarded?.[0]?.onboarded ?? false });
}
