/**
 * Username rules, shared by both onboarding paths.
 *
 * The student form validated this in the browser only, and the admin invite
 * form did not validate at all, so the server accepted anything either client
 * chose to send. This is the same rule the student form shows, enforced where
 * it counts.
 *
 * 5-20 characters, letters/digits/dot/underscore, cannot start or end with a
 * dot or underscore, and no consecutive dots.
 */
const USERNAME_PATTERN =
  /^(?![._])(?!.*[._]$)(?!.*\.\.)[a-zA-Z0-9._]{5,20}$/;

export type UsernameCheck =
  | { ok: true; username: string }
  | { ok: false; error: string };

export function validateUsername(value: unknown): UsernameCheck {
  if (typeof value !== "string") {
    return { ok: false, error: "A username is required." };
  }

  const username = value.trim();

  if (!username) {
    return { ok: false, error: "A username is required." };
  }

  if (username.length < 5 || username.length > 20) {
    return {
      ok: false,
      error: "Username must be between 5 and 20 characters.",
    };
  }

  if (!USERNAME_PATTERN.test(username)) {
    return {
      ok: false,
      error:
        "Use letters, numbers, dots and underscores only. It cannot start or end with a dot or underscore.",
    };
  }

  return { ok: true, username };
}
