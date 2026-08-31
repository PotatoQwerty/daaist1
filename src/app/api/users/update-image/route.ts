import { NextResponse } from "next/server";
import { createClient, supabaseServer } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { buildStoragePath, validateImageUpload } from "@/lib/upload-policy";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Each call writes an object to storage and deletes the previous one.
  const limited = enforceRateLimit(request, RATE_LIMITS.avatarUpload, {
    bucket: "avatar-upload",
    userId: user.id,
  });
  if (limited) return limited;

  const formData = await request.formData();
  const file = formData.get("file") as File;

  // Previously accepted anything, at any size: an .html file was stored on
  // the public bucket and served as markup.
  const imageCheck = validateImageUpload(file);
  if (!imageCheck.ok) {
    return NextResponse.json(
      { error: imageCheck.error },
      { status: imageCheck.status },
    );
  }

  // 🧩 Get the user's current image first
  const { data: userData, error: fetchError } = await supabaseServer
    .schema("public")
    .from("profiles")
    .select("image")
    .eq("user_id", user.id)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    console.error("Error fetching user image:", fetchError);
    return NextResponse.json(
      { error: "Error fetching user data" },
      { status: 500 },
    );
  }

  /* Delete the old image if it exists and is stored in Supabase.

     This removed from a bucket called "avatars" while uploading to "daa",
     and passed a path that still had the bucket name on the front, so it
     never actually deleted anything and every replaced avatar was left
     behind. Both are corrected here because the path construction below is
     changing anyway. */
  if (userData?.image?.includes("supabase.co")) {
    const publicSuffix = userData.image.split("/storage/v1/object/public/")[1];
    // publicSuffix looks like "daa/users/profile_pictures/<name>"; the
    // bucket prefix is not part of the object path.
    const oldImagePath = publicSuffix?.replace(/^daa\//, "");

    if (oldImagePath) {
      const { error: deleteError } = await supabaseServer.storage
        .from("daa")
        .remove([oldImagePath]);

      if (deleteError) {
        console.error("Error deleting old image:", deleteError);
        // Continue even if delete fails
      }
    }
  }

  // Extension comes from the validated content type, not from file.name.
  const fileName = `${user.id}-${randomUUID()}.${imageCheck.extension}`;
  // buildStoragePath drops the leading slash the old version produced, which
  // became an empty first segment in the object key.
  const filePath = buildStoragePath("users", "profile_pictures", fileName);

  const { error: uploadError } = await supabaseServer.storage
    .from("daa")
    .upload(filePath, file, { contentType: imageCheck.contentType });

  if (uploadError)
    return NextResponse.json(
      { error: "Error uploading file" },
      { status: 500 },
    );

  const { data: publicUrlData } = supabaseServer.storage
    .from("daa")
    .getPublicUrl(filePath);

  const { error: updateError } = await supabaseServer
    .schema("public")
    .from("profiles")
    .update({ image: publicUrlData.publicUrl })
    .eq("user_id", user.id);

  if (updateError)
    return NextResponse.json(
      { error: "Error updating profile" },
      { status: 500 },
    );

  return NextResponse.json({ imageUrl: publicUrlData.publicUrl });
}
