import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  const username = params.username;

  const { data: user, error } = await supabaseServer
    .from("users")
    .select("*")
    .eq("username", username)
    .single();

  if (error || !user) {
    return NextResponse.json(
      { error: error?.message || "user not found", username },
      { status: 404 }
    );
  }

  return NextResponse.json({ user });
}
