import { getUserRoles } from "@/lib/supabase/actions";
import { createClient, supabaseServer } from "@/lib/supabase/server";
import {
  describeUploadedUrl,
  parseDeclaredSize,
  parseUploadKey,
  resolveStoredContentType,
} from "@/lib/upload-policy";
import { validateShortText } from "@/lib/profile-validation";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { canUpload } = await getUserRoles(user.id);
  if (!canUpload) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Paired with the presigned-URL mint, so it shares that budget's shape.
  const limited = enforceRateLimit(req, RATE_LIMITS.uploadUrl, {
    bucket: "files-create",
    userId: user.id,
  });
  if (limited) return limited;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  /* The url used to be taken on trust. Because the delete route resolves
     ownership by matching this column, a caller could record a row pointing
     at somebody else's object - a club logo, say, which has no files row of
     its own - and then delete that object as if it were theirs.

     Two conditions close it: the url has to be one this app minted, and the
     key has to sit in the caller's own upload namespace. */
  const described = describeUploadedUrl(
    body.url,
    process.env.R2_PUBLIC_DOMAIN ?? "",
  );

  if (!described.ok) {
    return NextResponse.json({ error: "Invalid file URL" }, { status: 400 });
  }

  if (described.ownerId !== user.id) {
    return NextResponse.json(
      { error: "That upload does not belong to you" },
      { status: 403 },
    );
  }

  // One row per object, so the delete route can never find an ambiguous
  // match. The unique index on files.url is the real guarantee; this is
  // here to return something readable instead of a 500.
  const { data: existing } = await supabaseServer
    .schema("public")
    .from("files")
    .select("id")
    .eq("url", body.url)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "That file has already been recorded" },
      { status: 409 },
    );
  }

  /* The remaining columns were also taken on trust. `category`, `level` and
     `subject` decide which page a file appears on, and the server already
     chose all three when it signed the key - so they are read back out of
     the key rather than from the body. A body that disagrees is rejected
     rather than quietly overridden. */
  const parsedKey = parseUploadKey(described.key);
  if (!parsedKey.ok) {
    return NextResponse.json(
      { error: "That upload key is not recognised" },
      { status: 400 },
    );
  }

  const conflicts = (
    [
      ["category", parsedKey.category],
      ["level", parsedKey.level],
      ["subject", parsedKey.subject],
    ] as const
  ).filter(([field, derived]) => {
    const supplied = body[field];
    if (supplied === undefined || supplied === null || supplied === "") {
      return false;
    }
    return String(supplied) !== String(derived ?? "");
  });

  if (conflicts.length > 0) {
    return NextResponse.json(
      {
        error: `Upload metadata does not match the uploaded file (${conflicts
          .map(([field]) => field)
          .join(", ")}).`,
      },
      { status: 400 },
    );
  }

  // `file_name` is shown in the list and used as the download filename.
  const fileName = validateShortText(body.file_name, "File name", 120);
  if (!fileName.ok) {
    return NextResponse.json({ error: fileName.error }, { status: 400 });
  }

  const size = parseDeclaredSize(body.size);
  if (!size.ok) {
    return NextResponse.json({ error: size.error }, { status: size.status });
  }

  // Store the type the object is actually served with, so the row cannot
  // claim to be an image while R2 serves an attachment (the file list keys
  // its preview off this column).
  const { contentType } = resolveStoredContentType(body.type);

  const { error } = await supabaseServer.schema("public").from("files").insert({
    file_name: fileName.value,
    url: body.url,
    size: size.size,
    type: contentType,
    category: parsedKey.category,
    level: parsedKey.level,
    subject: parsedKey.subject,
    issum: body.issum === true,
    uploaded_by: user.id,
  });

  if (error) {
    console.error("File record insert failed:", error);
    return NextResponse.json(
      { error: "Could not record that file" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
