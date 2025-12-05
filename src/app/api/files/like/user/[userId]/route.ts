import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

import { auth } from "@/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth();
  const { userId } = await params;

  if (
    !session ||
    (session.user?.id !== userId && session.user?.role !== "admin")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!userId)
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  // 🪄 Fetch all liked files joined with the files table
  const { data, error } = await supabaseServer
    .schema("public")
    .from("likes")
    .select(
      `
      id,
      created_at,
      files (
        id,
        file_name,
        url,
        size,
        type,
        subject
      )
    `
    )
    .eq("user_id", userId);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Optionally map to only the files (if you don’t care about the "like" info)
  const likedFiles = data.map((like) => like.files);

  return NextResponse.json({ likedFiles });
}
