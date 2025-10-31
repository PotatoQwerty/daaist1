import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user.id;

  // 👇 await the promise first
  const { fileId } = await params;

  if (!userId) {
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
    ? currentLikes.filter((likedId) => likedId !== fileId)
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
