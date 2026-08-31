import { validateUsername } from "@/lib/username";

/**
 * Server-side rules for the writable profile fields.
 *
 * Every route that writes to `profiles` used to parse the body inline and
 * apply whatever it was given. /api/profile/update took `username` and
 * `image` as free strings, so the rules the onboarding form advertises could
 * be sidestepped by calling the route directly, and `image` could be set to
 * any string at all. /api/registration/onboarding and the admin editor each
 * had their own partial version of the same logic.
 *
 * This is the one place those rules live, so the three routes cannot drift.
 * `validateUsername` is reused rather than restated - it already encodes the
 * rule the signup form shows the user.
 */

/** Bounds chosen to fit the columns and the UI, not to be clever. */
export const PROFILE_LIMITS = {
  /** The bio textarea caps at 80; the server is deliberately looser so a
   *  longer value from a legitimate future client is not a hard error. */
  bio: 280,
  name: 60,
  phone: 32,
} as const;

/**
 * Hosts an avatar may be served from.
 *
 * These mirror `images.remotePatterns` in next.config.ts. A URL outside this
 * set renders as a broken image anyway (the optimizer refuses it), but the
 * value is also read by other surfaces, so it is rejected at write time
 * rather than left in the column.
 */
function allowedImageHosts(): Set<string> {
  const hosts = new Set(["cdn.daaist.com", "lh3.googleusercontent.com"]);

  // Derived rather than hardcoded, so a project migration does not silently
  // start rejecting every existing avatar.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    try {
      hosts.add(new URL(supabaseUrl).host);
    } catch {
      // Malformed env var: fall through with the static hosts.
    }
  }

  return hosts;
}

export type FieldResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

/** Trim, reject control characters, enforce a length ceiling. */
export function validateShortText(
  value: unknown,
  field: string,
  maxLength: number,
  { required = true }: { required?: boolean } = {},
): FieldResult<string> {
  if (typeof value !== "string") {
    return { ok: false, error: `${field} must be text.` };
  }

  // Control characters serve no purpose in these fields and make stored
  // values awkward to display and to log.
  if (/[\u0000-\u001f\u007f]/.test(value)) {
    return { ok: false, error: `${field} contains invalid characters.` };
  }

  const trimmed = value.trim();

  if (!trimmed) {
    if (required) return { ok: false, error: `${field} is required.` };
    return { ok: true, value: "" };
  }

  if (trimmed.length > maxLength) {
    return {
      ok: false,
      error: `${field} must be ${maxLength} characters or fewer.`,
    };
  }

  return { ok: true, value: trimmed };
}

/** Permissive about formatting, strict about length and character set. */
export function validatePhone(value: unknown): FieldResult<string> {
  const text = validateShortText(value, "Phone", PROFILE_LIMITS.phone, {
    required: false,
  });
  if (!text.ok) return text;
  if (!text.value) return text;

  if (!/^[+()\d\s.\-/]{4,}$/.test(text.value)) {
    return { ok: false, error: "Phone must be a valid phone number." };
  }

  return text;
}

/** https, and a host the app is willing to render. */
export function validateImageUrl(value: unknown): FieldResult<string> {
  if (typeof value !== "string") {
    return { ok: false, error: "Image must be a URL." };
  }

  const trimmed = value.trim();
  if (!trimmed) return { ok: true, value: "" };

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, error: "Image must be a valid URL." };
  }

  // Rejects javascript:, data: and http: in one check.
  if (parsed.protocol !== "https:") {
    return { ok: false, error: "Image must be an https URL." };
  }

  if (!allowedImageHosts().has(parsed.host)) {
    return { ok: false, error: "Image must be hosted on an approved domain." };
  }

  return { ok: true, value: parsed.toString() };
}

export type ProfileFieldInput = {
  username?: unknown;
  firstname?: unknown;
  lastname?: unknown;
  phone?: unknown;
  bio?: unknown;
  image?: unknown;
};

export type ProfileUpdate = Partial<{
  username: string;
  firstname: string;
  lastname: string;
  phone: string;
  bio: string;
  image: string;
}>;

/**
 * Validate whichever fields are present.
 *
 * Absent keys are left alone, matching the existing partial-update
 * behaviour: sending only `{ bio }` must not blank out the name.
 */
export function validateProfileFields(
  input: ProfileFieldInput,
): { ok: true; updates: ProfileUpdate } | { ok: false; error: string } {
  const updates: ProfileUpdate = {};

  if (input.username !== undefined) {
    const check = validateUsername(input.username);
    if (!check.ok) return { ok: false, error: check.error };
    updates.username = check.username;
  }

  for (const [key, label] of [
    ["firstname", "First name"],
    ["lastname", "Last name"],
  ] as const) {
    if (input[key] === undefined) continue;
    const check = validateShortText(input[key], label, PROFILE_LIMITS.name);
    if (!check.ok) return { ok: false, error: check.error };
    updates[key] = check.value;
  }

  if (input.phone !== undefined) {
    const check = validatePhone(input.phone);
    if (!check.ok) return { ok: false, error: check.error };
    updates.phone = check.value;
  }

  if (input.bio !== undefined) {
    const check = validateShortText(input.bio, "Bio", PROFILE_LIMITS.bio, {
      required: false,
    });
    if (!check.ok) return { ok: false, error: check.error };
    updates.bio = check.value;
  }

  if (input.image !== undefined) {
    const check = validateImageUrl(input.image);
    if (!check.ok) return { ok: false, error: check.error };
    updates.image = check.value;
  }

  return { ok: true, updates };
}

/** Postgres unique-violation, i.e. the username or matricule is taken. */
export const UNIQUE_VIOLATION = "23505";

/**
 * Turn a unique violation into a message naming the field that clashed.
 *
 * The onboarding route said "Username or registration number already taken"
 * for both, which left the person guessing which one to change.
 */
export function uniqueViolationMessage(detail?: string | null): string {
  const text = (detail ?? "").toLowerCase();

  if (text.includes("username")) return "That username is already taken.";
  if (text.includes("registration_number")) {
    return "That registration number is already linked to another account.";
  }

  return "That value is already taken.";
}
