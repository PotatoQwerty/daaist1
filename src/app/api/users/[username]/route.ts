import { NextResponse } from "next/server";
import { supabaseCli } from "../../../../../lib/supabase";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const { data, error } = await supabaseCli
    .from("users")
    .select("*")
    .eq("username", username)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "user not found", username },
      { status: 404 }
    );
  }

  return NextResponse.json({ user: data });
}


