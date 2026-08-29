import { NextResponse } from "next/server";
import { r2Client } from "@/lib/r2Client";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { createClient, supabaseServer } from "@/lib/supabase/server";
import { getUserRoles } from "@/lib/supabase/actions";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ filekey: string[] }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "unauthorized" }, { status: 401 });
  }

  // isSuperAdmin was previously ignored here, so a super_admin without a
  // separate admin row could not delete anything.
  const { isAdmin, isSuperAdmin } = await getUserRoles(user.id);
  const isSiteAdmin = isAdmin || isSuperAdmin;
  const fileKeyArray = (await params).filekey;
  const fileKey = fileKeyArray.join("/");

  // Check if user owns the file OR is admin
  // We need to fetch the file metadata first to check owner.
  const { data: fileData, error: fetchError } = await supabaseServer
    .schema("public")
    .from("files")
    .select("uploaded_by")
    .eq("url", `${process.env.R2_PUBLIC_DOMAIN}/${fileKey}`)
    .single();

  if (fetchError || !fileData) {
    return NextResponse.json({ message: "File not found" }, { status: 404 });
  }

  if (fileData.uploaded_by !== user.id && !isSiteAdmin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: fileKey,
    });

    await r2Client.send(command);

    const { error } = await supabaseServer
      .schema("public")
      .from("files")
      .delete()
      .eq("url", `${process.env.R2_PUBLIC_DOMAIN}/${fileKey}`);

    if (error) {
      console.error("Supabase delete error:", error);
      return NextResponse.json(
        { message: "Failed to delete from database" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: "File deleted successfully" },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 },
    );
  }
}
