import { auth } from "@/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ onboarded: null }, { status: 401 });
  }
  const { data: onboarded, error } = await supabaseServer
    .schema("public")
    .from("onboarding_status")
    .select("onboarded")
    .eq("user_id", session?.user.id);

  if (error)
    return NextResponse.json(
      {
        message: `Something went wrong, ${error.message}`,
      },
      { status: 500 }
    );

  return NextResponse.json({ onboarded: onboarded?.[0]?.onboarded ?? false });
}
