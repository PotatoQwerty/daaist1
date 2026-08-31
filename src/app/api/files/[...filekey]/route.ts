import { NextResponse } from "next/server";
import { r2Client } from "@/lib/r2Client";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { createClient, supabaseServer } from "@/lib/supabase/server";
import { getUserRoles } from "@/lib/supabase/actions";
import { describeUploadedUrl } from "@/lib/upload-policy";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

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
  // Destructive: this removes the object from R2, not just the row.
  const limited = enforceRateLimit(request, RATE_LIMITS.fileDelete, {
    bucket: "file-delete",
    userId: user.id,
  });
  if (limited) return limited;

  const { isAdmin, isSuperAdmin } = await getUserRoles(user.id);
  const isSiteAdmin = isAdmin || isSuperAdmin;
  const fileKeyArray = (await params).filekey;
  const fileKey = fileKeyArray.join("/");

  const fileUrl = `${process.env.R2_PUBLIC_DOMAIN}/${fileKey}`;

  /* Ownership is checked twice, because each check covers the other's gap.

     The database row says who uploaded it. That row used to be forgeable
     through /api/files/create, which is now bound to the caller's own key
     namespace, so it is trustworthy for anything recorded since.

     The key itself carries the uploader id for objects minted after that
     change, so it is checked independently. Keys from before the namespace
     existed report a null owner and fall back to the row alone. */
  const described = describeUploadedUrl(
    fileUrl,
    process.env.R2_PUBLIC_DOMAIN ?? "",
  );

  if (!described.ok) {
    return NextResponse.json({ message: "File not found" }, { status: 404 });
  }

  // Not .single(): that errors on a duplicate url and reported "not found",
  // which let one forged row block the real owner from ever deleting.
  const { data: fileRows, error: fetchError } = await supabaseServer
    .schema("public")
    .from("files")
    .select("uploaded_by")
    .eq("url", fileUrl);

  if (fetchError) {
    console.error("File lookup error:", fetchError);
    return NextResponse.json(
      { message: "Could not look up that file" },
      { status: 500 },
    );
  }

  if (!fileRows || fileRows.length === 0) {
    return NextResponse.json({ message: "File not found" }, { status: 404 });
  }

  if (fileRows.length > 1) {
    // Should be impossible once files.url is unique. Refuse rather than
    // guess which row grants permission.
    console.error("Ambiguous file url on delete:", fileUrl);
    return NextResponse.json(
      { message: "This file cannot be deleted automatically" },
      { status: 409 },
    );
  }

  const fileData = fileRows[0];
  const ownsRow = fileData.uploaded_by === user.id;
  const ownsKey = described.ownerId === null || described.ownerId === user.id;

  if (!isSiteAdmin && !(ownsRow && ownsKey)) {
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
      .eq("url", fileUrl);

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
  } catch (error) {
    console.error("File delete failed:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
