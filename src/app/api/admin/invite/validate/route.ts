import { supabaseServer } from "@/lib/supabase/server";
import { sha256 } from "@/lib/admin";
import { NextResponse } from "next/server";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { isInvitableRole, roleLabel } from "@/lib/roles";

export async function POST(req: Request) {
  // No session here by design, so this falls back to IP. It is a validity
  // oracle for invite tokens, which is worth slowing down even though the
  // tokens themselves are 256-bit.
  const limited = enforceRateLimit(req, RATE_LIMITS.inviteValidate, {
    bucket: "invite-validate",
  });
  if (limited) return limited;

  let body: { token?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const incomingHash = sha256(token);

  const { data: invite, error } = await supabaseServer
    .schema("public")
    .from("invites")
    .select("role_to_assign, expires_at")
    .eq("token_hash", incomingHash)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error) {
    console.error("Invite validation failed:", error);
    return NextResponse.json(
      { error: "Unable to check this invite right now." },
      { status: 500 },
    );
  }

  // One message for every failure mode: expired, already redeemed, and never
  // existed are indistinguishable to the caller on purpose.
  if (!invite || !isInvitableRole(invite.role_to_assign)) {
    return NextResponse.json(
      { error: "This invite link is invalid or has expired." },
      { status: 400 },
    );
  }

  // The role is returned so the landing page can say what is being accepted
  // before the person fills in a form.
  return NextResponse.json(
    {
      valid: true,
      role: invite.role_to_assign,
      roleLabel: roleLabel(invite.role_to_assign),
      expiresAt: invite.expires_at,
    },
    { status: 200 },
  );
}
