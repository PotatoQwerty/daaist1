import { supabaseServer } from "@/lib/supabase/server";
import { sha256 } from "@/lib/admin";
import { NextResponse } from "next/server";
export async function POST(req: Request) {
  const { token } = await req.json();

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const incomingHash = sha256(token);

  const { data: invite, error } = await supabaseServer
    .schema("public")
    .from("invites")
    .select("*")
    .eq("token_hash", incomingHash)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (error || !invite) {
    return NextResponse.json(
      { error: "Invalid or expired invite" },
      { status: 400 }
    );
  }

  return NextResponse.json({ message: "Token verified" }, { status: 200 });
}
