import { NextResponse } from "next/server";
import { createClient, supabaseServer } from "@/lib/supabase/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const { userId } = await params;

  if (error || !user || user.id !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!userId)
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  // 🪄 Fetch all liked files joined with the files table
  const { data, error: errorFetching } = await supabaseServer
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
    `,
    )
    .eq("user_id", userId);

  if (errorFetching)
    return NextResponse.json({ error: errorFetching.message }, { status: 500 });

  // Optionally map to only the files (if you don’t care about the "like" info)
  const likedFiles = data.map((like: any) => like.files);

  return NextResponse.json({ likedFiles });
}
