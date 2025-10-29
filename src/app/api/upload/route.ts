import { NextResponse } from "next/server";
import { r2Client } from "@/lib/r2Client";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { authOptions } from "../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;
    const category = formData.get("category") as string | null;
    const level = formData.get("level") as string | null;
    const subject = formData.get("subject") as string | null;
    const safeTitle = title?.replace(/ /g, "-");
    const fileType = file?.type;
    const fileSize = file?.size;

    if (!file) {
      return NextResponse.json(
        { message: "No file uploaded" },
        { status: 400 }
      );
    }

    // Build object key
    const pathParts = [category];
    if (level) pathParts.push(level);
    if (subject) pathParts.push(subject);
    const key = `${pathParts
      .filter(Boolean)
      .join("/")}/${crypto.randomUUID()}-${safeTitle || file.name}`;

    // Upload file to R2
    const arrayBuffer = await file.arrayBuffer();
    await r2Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: Buffer.from(arrayBuffer),
        ContentType: file.type,
      })
    );

    // Return public URL
    const fileUrl = `${process.env.R2_PUBLIC_DOMAIN}/${key}`;
    return NextResponse.json({
      message: "File uploaded successfully",
      fileUrl,
      fileType,
      fileSize,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ message: "Upload failed" }, { status: 500 });
  }
}
