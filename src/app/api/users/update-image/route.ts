import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import { auth } from "@/auth";

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file)
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

  // 🧩 Get the user's current image first
  const { data: userData, error: fetchError } = await supabaseServer
    .schema("public")
    .from("profiles")
    .select("image")
    .eq("user_id", session.user.id)
    .single();

  if (fetchError)
    return NextResponse.json({ error: fetchError.message }, { status: 500 });

  // 🗑️ Delete the old image if it's stored in Supabase
  if (userData?.image && userData.image.includes("supabase.co/storage/")) {
    try {
      const path = userData.image.split("/storage/v1/object/public/")[1];
      // Extract only the path relative to the bucket
      const filePath = path.replace(/^daa\//, ""); // remove bucket name prefix if present
      await supabaseServer.storage.from("daa").remove([filePath]);
    } catch (err) {
      console.warn("Failed to delete old image:", err);
    }
  }

  // 📤 Upload the new image
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = `users/profile_pictures/${randomUUID()}-${file.name}`;

  const { error: uploadError } = await supabaseServer.storage
    .from("daa")
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError)
    return NextResponse.json({ error: uploadError.message }, { status: 500 });

  // 🌐 Get the new public URL
  const { data: publicUrlData } = supabaseServer.storage
    .from("daa")
    .getPublicUrl(fileName);

  const imageUrl = publicUrlData.publicUrl;

  // 🧱 Update the user's image in the database
  const { error: updateError } = await supabaseServer
    .schema("public")
    .from("profiles")
    .update({ image: imageUrl })
    .eq("user_id", session.user.id);

  if (updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ success: true, imageUrl });
}
