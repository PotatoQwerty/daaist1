import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { r2Client } from "@/lib/r2Client";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@/auth";
import { getUserRoles } from "@/lib/supabase/actions";

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const { isAdmin } = await getUserRoles(session?.user?.id);

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { fileUrl } = await req.json();

    if (!fileUrl) {
      return NextResponse.json(
        { error: "No file URL provided" },
        { status: 400 }
      );
    }

    // Get R2 key from full URL
    const key = fileUrl.replace(`${process.env.R2_PUBLIC_DOMAIN}/`, "");

    // Delete from R2
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
      })
    );

    // Delete from Supabase
    const { error } = await supabaseServer
      .schema("public")
      .from("files")
      .delete()
      .eq("url", fileUrl)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { message: "File deleted successfully" },
      { status: 200 }
    );
  } catch (err) {
    console.error("Admin deletion error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Failed to delete file", details: message },
      { status: 500 }
    );
  }
}
