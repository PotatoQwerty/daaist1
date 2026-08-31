import { NextResponse } from "next/server";
import { createClient, supabaseServer } from "@/lib/supabase/server";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

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

  /* This route is very likely dead: it reads and writes public.users, which
     is not in the current schema, and no client code calls it. It is kept
     and secured rather than deleted because that cannot be confirmed from
     source - see sql/2026-08-31-verify-dead-user-routes.sql. */
  const limited = enforceRateLimit(req, RATE_LIMITS.likeToggle, {
    bucket: "like-toggle-legacy",
    userId,
  });
  if (limited) return limited;

  // 1️⃣ Fetch current likedposts
  const { data, error: fetchError } = await supabaseServer
    .from("users")
    .select("likedposts")
    .eq("id", userId)
    .single();

  if (fetchError) {
    console.error("Liked posts lookup failed:", fetchError);
    return NextResponse.json(
      { error: "Could not update that favourite" },
      { status: 400 },
    );
  }

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

  if (updateError) {
    console.error("Liked posts update failed:", updateError);
    return NextResponse.json(
      { error: "Could not update that favourite" },
      { status: 400 },
    );
  }

  // ✅ Return consistent field naming
  return NextResponse.json({ success: true, likedposts: newLikes });
}
