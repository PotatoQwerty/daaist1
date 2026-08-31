import test from "node:test";
import assert from "node:assert/strict";

import {
  PROFILE_LIMITS,
  uniqueViolationMessage,
  validateImageUrl,
  validatePhone,
  validateProfileFields,
  validateShortText,
} from "../src/lib/profile-validation.ts";

/* ------------------------------------------------------------------ *
 * M1 - /api/profile/update took every field on trust
 *
 * The route wrote `username` and `image` through as free strings, so the
 * username rules the signup form advertises were skippable by posting here
 * directly, and `image` could be set to anything at all.
 * ------------------------------------------------------------------ */

test("M1: the username rules are enforced, not just shown in the browser", () => {
  // Delegates to the same validator the invite flow uses, so the two paths
  // cannot diverge.
  for (const bad of [
    "ab", // too short
    "x".repeat(21), // too long
    ".leading",
    "trailing_",
    "has..dots",
    "has space",
    "hyphen-not-allowed",
    "",
    12345,
    null,
    { toString: () => "valid.name" },
  ]) {
    const result = validateProfileFields({ username: bad });
    assert.equal(
      result.ok,
      false,
      `username ${JSON.stringify(bad)} must be rejected`,
    );
  }

  const good = validateProfileFields({ username: "  valid.name_1  " });
  assert.equal(good.ok, true);
  if (good.ok) assert.equal(good.updates.username, "valid.name_1");
});

test("M1: an absent username is left alone rather than rejected", () => {
  // `undefined` means "not part of this update" - partial updates must keep
  // working, so this is distinct from an invalid value.
  const result = validateProfileFields({ username: undefined, bio: "hi" });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.ok(!("username" in result.updates));
});

test("M1: an image URL must be https and on an approved host", () => {
  for (const bad of [
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "http://cdn.daaist.com/a.png", // plain http
    "https://evil.example/a.png",
    "https://cdn.daaist.com.evil.example/a.png",
    "not a url",
  ]) {
    assert.equal(
      validateImageUrl(bad).ok,
      false,
      `image ${bad} must be rejected`,
    );
  }

  const good = validateImageUrl("https://cdn.daaist.com/clubs/logo/x.png");
  assert.equal(good.ok, true);
});

test("M1: text fields are length-capped server-side", () => {
  // The bio textarea caps at 80 in the browser only; nothing stopped a
  // direct POST writing an arbitrarily long value.
  const longBio = "x".repeat(PROFILE_LIMITS.bio + 1);
  assert.equal(validateProfileFields({ bio: longBio }).ok, false);
  assert.equal(validateProfileFields({ bio: "x".repeat(PROFILE_LIMITS.bio) }).ok, true);

  const longName = "x".repeat(PROFILE_LIMITS.name + 1);
  assert.equal(validateProfileFields({ firstname: longName }).ok, false);
});

test("M1: control characters are rejected but ordinary text is not", () => {
  assert.equal(validateShortText("John Doe", "Name", 60).ok, true);
  assert.equal(validateShortText("Zaki  Ben-Ali", "Name", 60).ok, true);
  // Accented characters are normal here - this is a French-language school.
  assert.equal(validateShortText("Amélie Déjà", "Name", 60).ok, true);

  assert.equal(validateShortText("bad\u0000null", "Name", 60).ok, false);
  assert.equal(validateShortText("bad\u001bescape", "Name", 60).ok, false);
  assert.equal(validateShortText("bad\u007fdel", "Name", 60).ok, false);
});

test("M1: values are trimmed, and required fields reject blank input", () => {
  const trimmed = validateShortText("  Zaki  ", "Name", 60);
  assert.equal(trimmed.ok, true);
  if (trimmed.ok) assert.equal(trimmed.value, "Zaki");

  assert.equal(validateShortText("   ", "Name", 60).ok, false);
  // Optional fields may be cleared.
  assert.equal(validateShortText("", "Bio", 60, { required: false }).ok, true);
});

test("M1: a partial update leaves absent fields alone", () => {
  // Sending only { bio } must not blank out the name.
  const result = validateProfileFields({ bio: "hello" });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(Object.keys(result.updates), ["bio"]);
});

test("M1: phone accepts real formats and rejects junk", () => {
  for (const good of ["+213 555 01 02 03", "0555010203", "(021) 12-34-56"]) {
    assert.equal(validatePhone(good).ok, true, `${good} should be accepted`);
  }
  for (const bad of ["abc", "<script>", "x".repeat(40)]) {
    assert.equal(validatePhone(bad).ok, false, `${bad} should be rejected`);
  }
});

/* ------------------------------------------------------------------ *
 * M2 - onboarding reported both conflicts with one message
 * ------------------------------------------------------------------ */

test("M2: a unique violation names the field that actually clashed", () => {
  assert.match(
    uniqueViolationMessage("Key (username)=(zaki) already exists."),
    /username/i,
  );
  assert.match(
    uniqueViolationMessage("Key (registration_number)=(123) already exists."),
    /registration number/i,
  );
  // Unknown constraint: still a usable sentence, no raw Postgres text.
  const fallback = uniqueViolationMessage(null);
  assert.ok(fallback.length > 0);
  assert.ok(!fallback.includes("Key ("));
});
