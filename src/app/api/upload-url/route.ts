import { NextResponse } from "next/server";
import { r2Client } from "@/lib/r2Client";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getUserRoles } from "@/lib/supabase/actions";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export const PUT = async (request: Request) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  // Teachers publish coursework too, so this is the upload capability
  // rather than an admin check.
  const { canUpload } = await getUserRoles(user.id);
  if (!canUpload)
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const limited = enforceRateLimit(request, RATE_LIMITS.uploadUrl, {
    bucket: "upload-url",
    userId: user.id,
  });
  if (limited) return limited;

  try {
    const formData = await request.formData();
    const title = formData.get("title") as string | null;
    const category = formData.get("category") as string | null;
    const level = formData.get("level") as string | null;
    const subject = formData.get("subject") as string | null;
    const safeTitle = title?.replace(/ /g, "-") || "untitled";
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
