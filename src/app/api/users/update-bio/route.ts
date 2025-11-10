import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const session = await auth();

  // 1️⃣ Check if logged in
  if (!session?.user.id)
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });

  const { bio } = await req.json();

  const { data, error } = await supabaseServer
    .from("users")
    .update({ bio: bio })
    .eq("id", session?.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
