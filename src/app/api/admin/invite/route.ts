import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getBaseUrl } from "@/lib/base-url";
import { createClient, supabaseServer } from "@/lib/supabase/server";
import { generateInviteToken } from "@/lib/admin";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { canAdminister, INVITABLE_ROLES, isInvitableRole } from "@/lib/roles";

/** How long a freshly issued link stays redeemable. */
const INVITE_EXPIRY_MS = 1000 * 60 * 60 * 24;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  // Reads every role row rather than .single(). With .single() an account
  // holding two roles produced an error, the role came back undefined, and a
  // legitimate admin was refused.
  const { data: roleRows, error: roleError } = await supabaseServer
    .schema("public")
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  if (roleError) {
    console.error("Invite role lookup failed:", roleError);
    return NextResponse.json(
      { error: "Unable to verify your permissions." },
      { status: 500 },
    );
  }

  const roles = (roleRows ?? []).map((row) => row.role);

  if (!canAdminister(roles)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limited = enforceRateLimit(req, RATE_LIMITS.inviteCreate, {
    bucket: "invite-create",
    userId: user.id,
  });
  if (limited) return limited;

  let body: { role?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!isInvitableRole(body.role)) {
    return NextResponse.json(
      {
        error: `Role must be one of: ${INVITABLE_ROLES.join(", ")}.`,
      },
      { status: 400 },
    );
  }

  const role = body.role;
  const { rawToken, hash } = generateInviteToken();
  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_MS);

  const { data: invite, error: tokenError } = await supabaseServer
    .schema("public")
    .from("invites")
    .insert({
      token_hash: hash,
      role_to_assign: role,
      created_by: user.id,
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (tokenError || !invite) {
    console.error("Invite creation failed:", tokenError);
    return NextResponse.json(
      { error: "Failed to create invite" },
      { status: 500 },
    );
  }

  /* The raw token is returned exactly once, here. Only its hash is stored,
     so it cannot be recovered later.

     NEXT_PUBLIC_BASE_URL is not set in the current environment, so this used
     to produce "/invite/<token>" with no origin - a link an admin could not
     paste into a message. getBaseUrl falls back to the request headers. */
  const baseUrl = getBaseUrl(await headers());
  const inviteLink = `${baseUrl}/invite/${rawToken}`;

  return NextResponse.json({
    id: invite.id,
    link: inviteLink,
    role,
    expiresAt: expiresAt.toISOString(),
  });
}
