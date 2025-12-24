import crypto from "crypto";

export function generateInviteToken() {
  const rawToken = crypto.randomBytes(32).toString("hex");

  const hash = crypto.createHash("sha256").update(rawToken).digest("hex");

  return { rawToken, hash };
}

export function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}
