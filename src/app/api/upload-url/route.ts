import { NextResponse } from "next/server";
import { r2Client } from "@/lib/r2Client";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getUserRoles } from "@/lib/supabase/actions";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import {
  buildUploadKey,
  parseDeclaredSize,
  resolveStoredContentType,
} from "@/lib/upload-policy";

/**
 * Five minutes, not an hour. The URL is used immediately by the form that
 * asked for it, so a long window only widens the reuse opportunity.
 */
const SIGNED_URL_TTL_SECONDS = 300;

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

    // Size is signed into the URL below, so R2 itself rejects a PUT that
    // does not match. The old 50 MB limit lived only in the browser and was
    // trivially skipped by calling this route directly.
    const declaredSize = parseDeclaredSize(formData.get("size"));
    if (!declaredSize.ok) {
      return NextResponse.json(
        { message: declaredSize.error },
        { status: declaredSize.status },
      );
    }

    // The caller no longer picks an arbitrary prefix, and the title can no
    // longer contribute path separators.
    const keyResult = buildUploadKey({
      category: formData.get("category"),
      level: formData.get("level"),
      subject: formData.get("subject"),
      title: formData.get("title"),
      userId: user.id,
      uuid: crypto.randomUUID(),
    });
    if (!keyResult.ok) {
      return NextResponse.json(
        { message: keyResult.error },
        { status: keyResult.status },
      );
    }
    const key = keyResult.key;

    // An unrecognised type is stored as an opaque attachment instead of
    // being refused, so uploads keep working while nothing the CDN serves
    // can execute as script.
    const { contentType, contentDisposition } = resolveStoredContentType(
      formData.get("type"),
    );

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      ContentType: contentType,
      ContentLength: declaredSize.size,
      ...(contentDisposition
        ? { ContentDisposition: contentDisposition }
        : {}),
    });
    const url = await getSignedUrl(r2Client, command, {
      expiresIn: SIGNED_URL_TTL_SECONDS,
    });
    const publicUrl = `${process.env.R2_PUBLIC_DOMAIN}/${key}`;

    // These headers are part of the signature, so the PUT has to send them
    // back verbatim. Returning them keeps the callers from having to
    // reconstruct the server's decision.
    const headers: Record<string, string> = { "Content-Type": contentType };
    if (contentDisposition) headers["Content-Disposition"] = contentDisposition;

    return NextResponse.json(
      { uploadUrl: url, publicUrl, headers },
      { status: 200 },
    );
  } catch (error) {
    console.error("Presigned upload URL failed:", error);
    return NextResponse.json(
      { message: "Could not prepare the upload." },
      { status: 500 },
    );
  }
};
