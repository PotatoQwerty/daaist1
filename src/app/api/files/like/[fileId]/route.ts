import { NextResponse } from "next/server";
import { createClient, supabaseServer } from "@/lib/supabase/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  const userId = user?.id;

  const { fileId } = await params;

  if (error || !userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // 1️⃣ Fetch current likedposts
  const { data, error: fetchError } = await supabaseServer
    .from("users")
    .select("likedposts")
    .eq("id", userId)
    .single();

  if (fetchError)
    return NextResponse.json({ error: fetchError.message }, { status: 400 });

  const currentLikes = data?.likedposts || [];

  // 2️⃣ Toggle logic (using fileId, not the whole object)
  const newLikes = currentLikes.includes(fileId)
    ? currentLikes.filter((likedId: string) => likedId !== fileId)
    : [...currentLikes, fileId];

  // 3️⃣ Update Supabase record
  const { error: updateError } = await supabaseServer
    .from("users")
    .update({ likedposts: newLikes })
    .eq("id", userId);

  if (updateError)
    return NextResponse.json({ error: updateError.message }, { status: 400 });

  // ✅ Return consistent field naming
  return NextResponse.json({ success: true, likedposts: newLikes });
}
