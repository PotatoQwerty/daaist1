import test from "node:test";
import assert from "node:assert/strict";

import {
  ALLOWED_UPLOAD_CATEGORIES,
  MAX_UPLOAD_BYTES,
  buildUploadKey,
  describeUploadedUrl,
  parseDeclaredSize,
  resolveStoredContentType,
  toObjectNameSlug,
  parseUploadKey,
  validateImageUpload,
  buildStoragePath,
  MAX_IMAGE_BYTES,
} from "../src/lib/upload-policy.ts";

const OWNER = "11111111-2222-4333-8444-555555555555";
const OTHER = "99999999-8888-4777-8666-555555555555";
const UUID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const CDN = "https://cdn.daaist.com";

/* ------------------------------------------------------------------ *
 * H3 - stored content type
 *
 * The bug: the caller's `type` was signed into the presigned URL verbatim,
 * so an uploader could have R2 serve their object as text/html from
 * cdn.daaist.com - a sibling of daaist.com, and therefore able to set
 * Domain=.daaist.com cookies over the app's auth cookie.
 * ------------------------------------------------------------------ */

test("H3: script-executing types are never served with their real type", () => {
  for (const dangerous of [
    "text/html",
    "image/svg+xml",
    "application/xhtml+xml",
    "text/xml",
    "application/javascript",
  ]) {
    const result = resolveStoredContentType(dangerous);
    assert.equal(
      result.contentType,
      "application/octet-stream",
      `${dangerous} must not be stored as itself`,
    );
    assert.equal(result.contentDisposition, "attachment");
  }
});

test("H3: a parameterised or cased dangerous type cannot slip past", () => {
  for (const sneaky of [
    "text/html; charset=utf-8",
    "TEXT/HTML",
    "  text/html  ",
    "Image/SVG+XML",
  ]) {
    assert.equal(
      resolveStoredContentType(sneaky).contentType,
      "application/octet-stream",
      `${sneaky} must be neutralised`,
    );
  }
});

test("H3: ordinary course material keeps its real content type", () => {
  for (const safe of [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
  ]) {
    const result = resolveStoredContentType(safe);
    assert.equal(result.contentType, safe);
    assert.equal(result.contentDisposition, undefined);
  }
});

test("H3: an unknown type is neutralised, not rejected", () => {
  // Architecture students upload DWG/RVT/ZIP. These must still work.
  const result = resolveStoredContentType("application/acad");
  assert.equal(result.contentType, "application/octet-stream");
  assert.equal(result.contentDisposition, "attachment");
});

/* ------------------------------------------------------------------ *
 * H3 - object key construction
 * ------------------------------------------------------------------ */

test("H3: the title cannot contribute path segments or traversal", () => {
  assert.equal(toObjectNameSlug("../../etc/passwd"), "etc-passwd");
  assert.equal(toObjectNameSlug("a/b/c"), "a-b-c");
  assert.equal(toObjectNameSlug("evil?x=1#frag"), "evil-x-1-frag");
  assert.equal(toObjectNameSlug("....."), "untitled");
  assert.equal(toObjectNameSlug("/"), "untitled");

  for (const slug of [
    toObjectNameSlug("../../etc/passwd"),
    toObjectNameSlug("a/b/c"),
    toObjectNameSlug("note\u0000.pdf"),
  ]) {
    assert.ok(!slug.includes("/"), "slug must never contain a separator");
    assert.ok(!slug.includes(".."), "slug must never contain a traversal");
  }
});

test("H3: the title is length-capped and never empty", () => {
  assert.equal(toObjectNameSlug("x".repeat(500)).length, 60);
  assert.equal(toObjectNameSlug(""), "untitled");
  assert.equal(toObjectNameSlug(undefined), "untitled");
  assert.equal(toObjectNameSlug(12345), "untitled");
});

test("H3: an arbitrary category prefix is refused", () => {
  for (const category of ["../../", "anything", "clubs", "", "course/../doc"]) {
    const result = buildUploadKey({
      category,
      title: "x",
      userId: OWNER,
      uuid: UUID,
    });
    assert.equal(result.ok, false, `category ${category} must be refused`);
  }
});

test("H3: the categories the app actually uses still work", () => {
  for (const category of ALLOWED_UPLOAD_CATEGORIES) {
    const result = buildUploadKey({
      category,
      title: "logo.png",
      userId: OWNER,
      uuid: UUID,
    });
    assert.equal(result.ok, true, `category ${category} must be accepted`);
  }
});

test("H3: the key is namespaced under the uploader", () => {
  const result = buildUploadKey({
    category: "course",
    level: "L1",
    subject: "THP",
    title: "Lecture 1",
    userId: OWNER,
    uuid: UUID,
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.key, `course/L1/THP/${OWNER}/${UUID}-Lecture-1`);
  assert.ok(result.key.includes(`/${OWNER}/`));
});

test("H3: an unknown level or subject is refused", () => {
  const badLevel = buildUploadKey({
    category: "course",
    level: "../../",
    title: "x",
    userId: OWNER,
    uuid: UUID,
  });
  assert.equal(badLevel.ok, false);

  const badSubject = buildUploadKey({
    category: "course",
    level: "L1",
    subject: "a/b",
    title: "x",
    userId: OWNER,
    uuid: UUID,
  });
  assert.equal(badSubject.ok, false);
});

/* ------------------------------------------------------------------ *
 * H3 - size ceiling
 *
 * The bug: the only 50 MB check was in the browser, and the presigned URL
 * carried no ContentLength condition.
 * ------------------------------------------------------------------ */

test("H3: the size ceiling is enforced server-side", () => {
  assert.equal(parseDeclaredSize(MAX_UPLOAD_BYTES).ok, true);

  const tooBig = parseDeclaredSize(MAX_UPLOAD_BYTES + 1);
  assert.equal(tooBig.ok, false);
  if (!tooBig.ok) assert.equal(tooBig.status, 413);
});

test("H3: a missing or nonsense size is refused", () => {
  for (const value of [undefined, null, "", "abc", -1, 0, 1.5, NaN, Infinity]) {
    assert.equal(
      parseDeclaredSize(value).ok,
      false,
      `size ${String(value)} must be refused`,
    );
  }
});

/* ------------------------------------------------------------------ *
 * H5 - URL ownership
 *
 * The bug: /api/files/create took `url` on trust, and the delete route
 * resolved permission by matching that column. A forged row pointing at a
 * club logo (which has no files row of its own) authorised deleting it.
 * ------------------------------------------------------------------ */

test("H5: a URL outside our own CDN is rejected", () => {
  for (const url of [
    "https://evil.example/course/x",
    "https://cdn.daaist.com.evil.example/x",
    "http://cdn.daaist.com/x",
    "not a url",
    "",
    undefined,
  ]) {
    assert.equal(
      describeUploadedUrl(url, CDN).ok,
      false,
      `${String(url)} must be rejected`,
    );
  }
});

test("H5: a traversal in the key is rejected", () => {
  assert.equal(describeUploadedUrl(`${CDN}/course/../../secret`, CDN).ok, false);
});

test("H5: the owner is read out of the key", () => {
  const result = describeUploadedUrl(
    `${CDN}/course/L1/THP/${OWNER}/${UUID}-notes`,
    CDN,
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.ownerId, OWNER);
  assert.equal(result.key, `course/L1/THP/${OWNER}/${UUID}-notes`);
});

test("H5: another user's key does not report the caller as owner", () => {
  const result = describeUploadedUrl(
    `${CDN}/clubs/logo/${OTHER}/${UUID}-logo.png`,
    CDN,
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.notEqual(result.ownerId, OWNER);
  assert.equal(result.ownerId, OTHER);
});

test("H5: a pre-namespace legacy key reports no owner rather than a wrong one", () => {
  // These predate the fix and must still be deletable via the database row,
  // so the key check has to abstain instead of guessing.
  const result = describeUploadedUrl(`${CDN}/course/${UUID}-old-file`, CDN);

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.ownerId, null);
});

test("H5: a trailing slash on the configured domain is tolerated", () => {
  const result = describeUploadedUrl(
    `${CDN}/course/${OWNER}/${UUID}-x`,
    `${CDN}/`,
  );
  assert.equal(result.ok, true);
});

/* ------------------------------------------------------------------ *
 * M3 - /api/files/create trusted the client's classification
 *
 * category, level and subject decide which page a file shows up on, and
 * they came from the request body. The server had already chosen all three
 * when it signed the key, so the key is the trustworthy copy.
 * ------------------------------------------------------------------ */

test("M3: the classification is recovered from the signed key", () => {
  const parsed = parseUploadKey(`course/L2/HCA/${OWNER}/${UUID}-notes`);

  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.category, "course");
  assert.equal(parsed.level, "L2");
  assert.equal(parsed.subject, "HCA");
  assert.equal(parsed.ownerId, OWNER);
});

test("M3: the two-segment club categories parse as one category", () => {
  for (const category of ["clubs/logo", "clubs/banner"]) {
    const parsed = parseUploadKey(`${category}/${OWNER}/${UUID}-logo.png`);
    assert.equal(parsed.ok, true, `${category} should parse`);
    if (!parsed.ok) continue;
    assert.equal(parsed.category, category);
    assert.equal(parsed.level, null);
    assert.equal(parsed.subject, null);
    assert.equal(parsed.ownerId, OWNER);
  }
});

test("M3: a key with no level or subject reports them as null", () => {
  const parsed = parseUploadKey(`doc/${OWNER}/${UUID}-form.pdf`);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.category, "doc");
  assert.equal(parsed.level, null);
});

test("M3: a key claiming an unknown category is refused", () => {
  assert.equal(parseUploadKey(`secrets/${OWNER}/${UUID}-x`).ok, false);
  assert.equal(parseUploadKey(`${OWNER}/${UUID}-x`).ok, false);
  assert.equal(parseUploadKey("course").ok, false);
  assert.equal(parseUploadKey("").ok, false);
});

test("M3: buildUploadKey and parseUploadKey agree", () => {
  // The round trip is the actual guarantee: whatever the mint route encodes,
  // the create route must decode identically.
  for (const input of [
    { category: "course", level: "L1", subject: "THP" },
    { category: "td", level: "M2", subject: undefined },
    { category: "doc", level: undefined, subject: undefined },
    { category: "clubs/logo", level: undefined, subject: undefined },
    { category: "clubs/banner", level: undefined, subject: undefined },
  ] as const) {
    const built = buildUploadKey({
      ...input,
      title: "Some File",
      userId: OWNER,
      uuid: UUID,
    });
    assert.equal(built.ok, true, `${input.category} should build`);
    if (!built.ok) continue;

    const parsed = parseUploadKey(built.key);
    assert.equal(parsed.ok, true, `${built.key} should parse`);
    if (!parsed.ok) continue;

    assert.equal(parsed.category, input.category);
    assert.equal(parsed.level, input.level ?? null);
    assert.equal(parsed.subject, input.subject ?? null);
    assert.equal(parsed.ownerId, OWNER);
  }
});

/* ------------------------------------------------------------------ *
 * M4 - direct Supabase Storage uploads had no checks
 *
 * Avatars and club event artwork bypass the presigned flow. Neither had a
 * type or size check, and the avatar route took the stored extension from
 * the uploaded filename.
 * ------------------------------------------------------------------ */

test("M4: executable image formats are refused outright", () => {
  // Unlike the R2 path these cannot be neutralised by storing them as an
  // attachment - they are rendered by the app as images - so they are
  // rejected instead.
  for (const dangerous of [
    "image/svg+xml",
    "text/html",
    "application/xhtml+xml",
    "text/xml",
    "application/javascript",
    "",
  ]) {
    const result = validateImageUpload({ type: dangerous, size: 1000 });
    assert.equal(result.ok, false, `${dangerous} must be refused`);
    if (!result.ok) assert.equal(result.status, 415);
  }
});

test("M4: ordinary image formats are accepted with a derived extension", () => {
  const expected: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
  };

  for (const [type, extension] of Object.entries(expected)) {
    const result = validateImageUpload({ type, size: 5000 });
    assert.equal(result.ok, true, `${type} should be accepted`);
    if (!result.ok) continue;
    // The extension comes from the type, never from the filename, so an
    // "avatar.html" cannot decide how the object is named.
    assert.equal(result.extension, extension);
    assert.equal(result.contentType, type);
  }
});

test("M4: a parameterised or cased image type still resolves", () => {
  const result = validateImageUpload({ type: "IMAGE/PNG; charset=binary", size: 10 });
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.extension, "png");
});

test("M4: the size ceiling is enforced", () => {
  assert.equal(validateImageUpload({ type: "image/png", size: MAX_IMAGE_BYTES }).ok, true);

  const tooBig = validateImageUpload({
    type: "image/png",
    size: MAX_IMAGE_BYTES + 1,
  });
  assert.equal(tooBig.ok, false);
  if (!tooBig.ok) assert.equal(tooBig.status, 413);

  assert.equal(validateImageUpload({ type: "image/png", size: 0 }).ok, false);
  assert.equal(validateImageUpload(null).ok, false);
  assert.equal(validateImageUpload(undefined).ok, false);
});

test("M4: storage paths never lead with a slash or double up", () => {
  // `/users/profile_pictures/x.png` produced an empty first segment in the
  // object key and a doubled slash in the public URL.
  assert.equal(
    buildStoragePath("users", "profile_pictures", "a.png"),
    "users/profile_pictures/a.png",
  );
  assert.equal(buildStoragePath("/users/", "/a.png"), "users/a.png");
  assert.equal(buildStoragePath("clubs", "events", "id", "banner"), "clubs/events/id/banner");

  for (const path of [
    buildStoragePath("/users/", "/a.png"),
    buildStoragePath("", "clubs", "", "logo"),
  ]) {
    assert.ok(!path.startsWith("/"), "must not lead with a slash");
    assert.ok(!path.includes("//"), "must not contain an empty segment");
  }
});
