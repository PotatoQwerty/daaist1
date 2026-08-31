/**
 * What a presigned upload is allowed to be.
 *
 * The presigned-URL route used to take `category`, `level`, `subject`,
 * `title` and `type` straight from the request and sign whatever came back.
 * That meant the caller chose the object key anywhere in the bucket, chose
 * the Content-Type the CDN would later serve the object with, and had no
 * size ceiling at all (the 50 MB check lived only in the browser).
 *
 * Serving attacker-controlled `text/html` from cdn.daaist.com matters more
 * than it looks: that host is a sibling of daaist.com, so script running
 * there can set `Domain=.daaist.com` cookies and overwrite the Supabase auth
 * cookie on the app.
 *
 * The rules live here, separate from the route, so they can be tested
 * without standing up a request.
 */

/**
 * Types the CDN may serve with their real Content-Type.
 *
 * Everything else is stored as `application/octet-stream` and marked as an
 * attachment rather than rejected: students legitimately upload DWG, RVT,
 * ZIP and similar, and neutralising an unknown type is as safe as refusing
 * it while keeping those uploads working.
 *
 * Deliberately excluded, and why: text/html, application/xhtml+xml and
 * image/svg+xml all execute script when a browser renders them.
 */
const INLINE_SAFE_CONTENT_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

/** Key prefixes the app actually writes to. */
export const ALLOWED_UPLOAD_CATEGORIES = new Set([
  "course",
  "td",
  "doc",
  "clubs/logo",
  "clubs/banner",
]);

/** Matches the ceiling the upload form already showed the user. */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

/* ------------------------------------------------------------------ *
 * Direct-to-Supabase-Storage image uploads
 *
 * Avatars and club event artwork do not go through a presigned URL - the
 * route receives the File and hands it to supabase.storage. Those paths had
 * no type check and no size check at all, and one of them took the stored
 * file extension from the uploaded filename, so an account could park an
 * .html file on the public bucket and have it served as markup.
 * ------------------------------------------------------------------ */

/**
 * Image types accepted for avatars and event artwork, and the extension
 * each one is stored with.
 *
 * The extension comes from this map rather than from `file.name`, so a file
 * called `avatar.html` cannot decide how the object is named.
 *
 * SVG is deliberately absent: it is an image to a designer but a script
 * container to a browser.
 */
export const IMAGE_UPLOAD_TYPES = new Map<string, string>([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

/** Matches the 15 MB ceiling the club forms already showed the user. */
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

export type ImageUploadCheck =
  | { ok: true; contentType: string; extension: string }
  | { ok: false; error: string; status: number };

/**
 * Validate an uploaded image by its declared type and size.
 *
 * This trusts `file.type`, which the client sets - but it is only ever used
 * to pick from the allowlist above. A mislabelled file is stored under an
 * image content type it does not match, which renders as a broken image
 * rather than as anything executable.
 */
export function validateImageUpload(
  file: { type?: string; size?: number } | null | undefined,
  maxBytes: number = MAX_IMAGE_BYTES,
): ImageUploadCheck {
  if (!file) {
    return { ok: false, error: "No file provided", status: 400 };
  }

  const mediaType = (file.type ?? "").split(";")[0].trim().toLowerCase();
  const extension = IMAGE_UPLOAD_TYPES.get(mediaType);

  if (!extension) {
    return {
      ok: false,
      error: `Unsupported image type. Allowed: ${[...IMAGE_UPLOAD_TYPES.keys()].join(", ")}`,
      status: 415,
    };
  }

  const size = file.size ?? 0;
  if (!Number.isFinite(size) || size <= 0) {
    return { ok: false, error: "That file is empty", status: 400 };
  }

  if (size > maxBytes) {
    return {
      ok: false,
      error: `Image must be smaller than ${Math.floor(maxBytes / (1024 * 1024))} MB`,
      status: 413,
    };
  }

  return { ok: true, contentType: mediaType, extension };
}

/**
 * Build a storage object path.
 *
 * Joins on single slashes and never leads with one: the avatar route built
 * `/users/profile_pictures/...`, and that leading slash becomes an empty
 * first segment in the object key and a doubled slash in the public URL.
 */
export function buildStoragePath(...segments: string[]): string {
  return segments
    .flatMap((segment) => segment.split("/"))
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join("/");
}

/** Study-year codes that may appear in a key. Mirrors uploadConstants. */
const ALLOWED_LEVELS = new Set(["L1", "L2", "L3", "M1", "M2"]);

/** Subject codes are short identifiers, never free text. */
const SUBJECT_PATTERN = /^[A-Za-z0-9_-]{1,32}$/;

/**
 * Reduce a user-supplied title to a single safe path segment.
 *
 * The old version only replaced spaces, so a title could contain `/`, `?`,
 * `#` or `..` and either add path segments to the key or desynchronise the
 * stored key from the public URL handed back to the client.
 */
export function toObjectNameSlug(title: unknown): string {
  if (typeof title !== "string") return "untitled";

  const slug = title
    .normalize("NFKD")
    // Anything that is not a plain filename character becomes a dash. This
    // takes out path separators, query and fragment markers, control
    // characters and every Unicode lookalike in one pass.
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    // A leading dot would create a hidden-file style segment; a run of dots
    // is the traversal shape.
    .replace(/\.{2,}/g, "-")
    .replace(/^[.\-]+/, "")
    .replace(/[.\-]+$/, "")
    .slice(0, 60);

  return slug || "untitled";
}

/**
 * The Content-Type the object will be stored and served with, plus the
 * disposition that goes with it.
 */
export function resolveStoredContentType(requested: unknown): {
  contentType: string;
  contentDisposition?: string;
} {
  const candidate =
    typeof requested === "string" ? requested.trim().toLowerCase() : "";

  // A parameterised type ("text/html; charset=utf-8") must not sneak past a
  // set lookup, so compare on the bare media type.
  const mediaType = candidate.split(";")[0].trim();

  if (INLINE_SAFE_CONTENT_TYPES.has(mediaType)) {
    return { contentType: mediaType };
  }

  return {
    contentType: "application/octet-stream",
    contentDisposition: "attachment",
  };
}

export type UploadKeyInput = {
  category: unknown;
  level?: unknown;
  subject?: unknown;
  title: unknown;
  userId: string;
  /** Injected so tests are deterministic. */
  uuid: string;
};

export type UploadKeyResult =
  | { ok: true; key: string }
  | { ok: false; error: string; status: number };

/**
 * Build the object key.
 *
 * The `<userId>` segment is the part that matters for ownership: it means an
 * account can only ever write inside its own namespace, and it gives the
 * delete route a way to tell whether a key really belongs to the caller
 * instead of trusting a database row the caller supplied.
 */
export function buildUploadKey(input: UploadKeyInput): UploadKeyResult {
  const category =
    typeof input.category === "string" ? input.category.trim() : "";

  if (!ALLOWED_UPLOAD_CATEGORIES.has(category)) {
    return { ok: false, error: "Unsupported category", status: 400 };
  }

  const level = typeof input.level === "string" ? input.level.trim() : "";
  if (level && !ALLOWED_LEVELS.has(level)) {
    return { ok: false, error: "Unknown level", status: 400 };
  }

  const subject = typeof input.subject === "string" ? input.subject.trim() : "";
  if (subject && !SUBJECT_PATTERN.test(subject)) {
    return { ok: false, error: "Unknown subject", status: 400 };
  }

  if (!input.userId) {
    return { ok: false, error: "Missing uploader", status: 401 };
  }

  const prefix = [category, level, subject].filter(Boolean).join("/");
  const name = `${input.uuid}-${toObjectNameSlug(input.title)}`;

  return { ok: true, key: `${prefix}/${input.userId}/${name}` };
}

/** Validates the size the client declares, which is what gets signed. */
export function parseDeclaredSize(
  value: unknown,
): { ok: true; size: number } | { ok: false; error: string; status: number } {
  const size = Number(value);

  if (!Number.isInteger(size) || size <= 0) {
    return { ok: false, error: "A valid file size is required", status: 400 };
  }

  if (size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error: `File must be smaller than ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB`,
      status: 413,
    };
  }

  return { ok: true, size };
}

/**
 * Recover the classification the server itself chose when it signed the key.
 *
 * /api/files/create takes `category`, `level` and `subject` from the request
 * body, so the row describing a file could disagree with where the file
 * actually sits - a course file could be filed as a document, or under a
 * year it was not uploaded for. The key already encodes all three, and the
 * server built it, so it is the trustworthy copy.
 *
 * Mirrors buildUploadKey: <category>[/<level>][/<subject>]/<ownerId>/<name>,
 * where category is itself two segments for the club prefixes.
 */
export function parseUploadKey(key: string):
  | {
      ok: true;
      category: string;
      level: string | null;
      subject: string | null;
      ownerId: string | null;
      name: string;
    }
  | { ok: false } {
  const segments = key.split("/").filter(Boolean);

  // At minimum: category / owner / name.
  if (segments.length < 3) return { ok: false };

  const name = segments[segments.length - 1];
  const ownerCandidate = segments[segments.length - 2];
  const ownerId = UPLOAD_OWNER_UUID.test(ownerCandidate)
    ? ownerCandidate
    : null;

  const prefix = segments.slice(0, segments.length - 2);
  if (prefix.length === 0) return { ok: false };

  // "clubs/logo" and "clubs/banner" are two segments; every other category
  // is one.
  const isClubPrefix = prefix[0] === "clubs" && prefix.length >= 2;
  const category = isClubPrefix ? `${prefix[0]}/${prefix[1]}` : prefix[0];
  const rest = prefix.slice(isClubPrefix ? 2 : 1);

  if (!ALLOWED_UPLOAD_CATEGORIES.has(category)) return { ok: false };

  return {
    ok: true,
    category,
    level: rest[0] ?? null,
    subject: rest[1] ?? null,
    ownerId,
    name,
  };
}

/** Shared by describeUploadedUrl and parseUploadKey. */
const UPLOAD_OWNER_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Whether a stored file URL is one this app minted, and whose namespace it
 * falls in. Used by the file-record and delete routes so ownership is
 * derived from the key rather than from a client-supplied database row.
 */
export function describeUploadedUrl(
  url: unknown,
  publicDomain: string,
): { ok: true; key: string; ownerId: string | null } | { ok: false } {
  if (typeof url !== "string" || !publicDomain) return { ok: false };

  const base = publicDomain.replace(/\/+$/, "");
  if (!url.startsWith(`${base}/`)) return { ok: false };

  const key = url.slice(base.length + 1);
  if (!key || key.includes("..")) return { ok: false };

  // <category>[/<level>][/<subject>]/<uuid-owner>/<name>: the owner segment is
  // the one immediately before the file name. Legacy keys predate the
  // namespace and report a null owner.
  const segments = key.split("/");
  const ownerCandidate = segments.length >= 2 ? segments[segments.length - 2] : "";

  return {
    ok: true,
    key,
    ownerId: UPLOAD_OWNER_UUID.test(ownerCandidate) ? ownerCandidate : null,
  };
}
