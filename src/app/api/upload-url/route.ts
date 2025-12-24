import { NextResponse } from "next/server";
import { r2Client } from "@/lib/r2Client";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { redirect, RedirectType } from "next/navigation";
import { getUserRoles } from "@/lib/supabase/actions";
import { auth } from "@/auth";

export const PUT = async (request: Request) => {
  const session = await auth();
  if (!session) redirect("/", RedirectType.replace);
  const { isAdmin } = await getUserRoles(session?.user.id!);
  if (!isAdmin || !session) redirect("/", RedirectType.replace);

  try {
    const formData = await request.formData();
    const title = formData.get("title") as string | null;
    const category = formData.get("category") as string | null;
    const level = formData.get("level") as string | null;
    const subject = formData.get("subject") as string | null;
    const safeTitle = title?.replace(/ /g, "-");
    const contentType = formData.get("type") as string;

    // Build object key
    const pathParts = [category];
    if (level) pathParts.push(level);
    if (subject) pathParts.push(subject);
    const key = `${pathParts
      .filter(Boolean)
      .join("/")}/${crypto.randomUUID()}-${safeTitle || "untitled"}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      ContentType: contentType || "application/octet-stream",
    });
    const url = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
    const publicUrl = `${process.env.R2_PUBLIC_DOMAIN}/${key}`;

    return NextResponse.json(
      { uploadUrl: url, publicUrl: publicUrl },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "something went Wrong", error: error.message },
      { status: 500 }
    );
  }
};
