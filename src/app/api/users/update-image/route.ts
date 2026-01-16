import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file)
    return NextResponse.json({ error: "No file provided" }, { status: 400 });

  // 🧩 Get the user's current image first
  const { data: userData, error: fetchError } = await supabase
    .schema("public")
    .from("profiles")
    .select("image")
    .eq("user_id", user.id)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    console.log("fetchError", fetchError);

    console.error("Error fetching user image:", fetchError);
    return NextResponse.json(
      { error: "Error fetching user data" },
      { status: 500 }
    );
  }

  // 🗑️ Delete the old image if it exists and is stored in Supabase
  if (userData?.image?.includes("supabase.co")) {
    const oldImagePath = userData.image.split("/storage/v1/object/public/")[1];
    if (oldImagePath) {
      const { error: deleteError } = await supabase.storage
        .from("avatars") // Ensure this matches your bucket name
        .remove([oldImagePath]);

      if (deleteError) {
        console.error("Error deleting old image:", deleteError);
        // Continue even if delete fails
      }
    }
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${user.id}-${randomUUID()}.${fileExt}`;
  const filePath = `/users/profile_pictures/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("daa")
    .upload(filePath, file);

  if (uploadError)
    return NextResponse.json(
      { error: "Error uploading file" },
      { status: 500 }
    );

  const { data: publicUrlData } = supabase.storage
    .from("daa")
    .getPublicUrl(filePath);

  const { error: updateError } = await supabase
    .schema("public")
    .from("profiles")
    .update({ image: publicUrlData.publicUrl })
    .eq("user_id", user.id);

  if (updateError)
    return NextResponse.json(
      { error: "Error updating profile" },
      { status: 500 }
    );

  return NextResponse.json({ imageUrl: publicUrlData.publicUrl });
}
