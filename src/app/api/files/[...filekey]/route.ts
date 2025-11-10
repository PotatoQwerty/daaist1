import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2Client } from "@/lib/r2Client";
import { auth } from "@/auth";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ filekey: string | string[] }> }
) {
  const session = await auth();

  try {
    const { filekey } = await params;

    const keyParts = Array.isArray(filekey) ? filekey.slice(2) : [];
    const key = keyParts.join("/");

    // Delete from R2
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
      })
    );

    // Delete from Supabase
    const { data, error } = await supabaseServer
      .schema("public")
      .from("files")
      .delete()
      .eq("url", `${process.env.R2_PUBLIC_DOMAIN}/${key}`)
      .select();

    if (error) {
      console.error("Supabase deletion error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "File deleted successfully", data });
  } catch (err) {
    console.error("Deletion error:", err);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
