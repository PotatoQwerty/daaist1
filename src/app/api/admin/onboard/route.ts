import { NextResponse } from "next/server";
import { createClient, supabaseServer } from "@/lib/supabase/server";
import { sha256 } from "@/lib/admin";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { isInvitableRole, roleLabel } from "@/lib/roles";
import { validateUsername } from "@/lib/username";

const INVALID_INVITE = "This invite link is invalid, expired, or already used.";

/**
 * Put a claimed invite back.
 *
 * Called when a later step fails. Without it the invite was consumed and the
 * account was left with no role, so the link was spent and the person was
 * stuck with no way to retry.
 */
async function releaseInvite(tokenHash: string, userId: string) {
  const { error } = await supabaseServer
    .schema("public")
    .from("invites")
    .update({ used_at: null, used_by: null })
    .eq("token_hash", tokenHash)
    // Scoped to the claim this request made, so it can never release an
    // invite that some other request legitimately holds.
    .eq("used_by", userId);

  if (error) {
    console.error("Failed to release invite after a failed redemption:", error);
  }
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = enforceRateLimit(req, RATE_LIMITS.inviteRedeem, {
    bucket: "invite-redeem",
    userId: user.id,
  });
  if (limited) return limited;

  let body: { token?: unknown; form?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  const form = body.form ?? {};

  if (!token) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  /* 1. Validate the submitted profile before touching the invite, so a
        malformed form never costs someone their single-use link. */
  const usernameCheck = validateUsername(form.username);
  if (!usernameCheck.ok) {
    return NextResponse.json({ error: usernameCheck.error }, { status: 400 });
  }
  const username = usernameCheck.username;

  const firstname =
    typeof form.firstname === "string" ? form.firstname.trim() : "";
  const lastname =
    typeof form.lastname === "string" ? form.lastname.trim() : "";
  const phone = typeof form.phone === "string" ? form.phone.trim() : "";

  if (!firstname || !lastname) {
    return NextResponse.json(
      { error: "First and last name are required." },
      { status: 400 },
    );
  }

  /* 2. Onboarding runs once per account. */
  const { data: onboarding } = await supabaseServer
    .schema("public")
    .from("onboarding_status")
    .select("onboarded")
    .eq("user_id", user.id)
    .maybeSingle();

  if (onboarding?.onboarded) {
    return NextResponse.json(
      {
        status: "already_onboarded",
        error: "This account has already been set up.",
      },
      { status: 409 },
    );
  }

  /* 3. Username availability. The unique constraint is the real guarantee;
        this is here to return a usable message instead of a 500. */
  const { data: usernameOwner } = await supabaseServer
    .schema("public")
    .from("profiles")
    .select("user_id")
    .eq("username", username)
    .maybeSingle();

  if (usernameOwner && usernameOwner.user_id !== user.id) {
    return NextResponse.json(
      { error: "That username is already taken." },
      { status: 409 },
    );
  }

  const tokenHash = sha256(token);

  /* 4. Claim the invite atomically.

        This was previously a SELECT to check the invite followed by a separate
        UPDATE to consume it. Two requests could both pass the check, and the
        losing UPDATE matched zero rows without returning an error, so both
        callers went on to be granted the role. A single conditional UPDATE
        with `used_at IS NULL` takes a row lock, so exactly one caller can win,
        and .select() reports whether this caller was the winner. */
  const { data: claimedRows, error: claimError } = await supabaseServer
    .schema("public")
    .from("invites")
    .update({ used_at: new Date().toISOString(), used_by: user.id })
    .eq("token_hash", tokenHash)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("id, role_to_assign");

  if (claimError) {
    console.error("Invite claim failed:", claimError);
    return NextResponse.json(
      { error: "Unable to redeem this invite right now." },
      { status: 500 },
    );
  }

  if (!claimedRows || claimedRows.length === 0) {
    return NextResponse.json({ error: INVALID_INVITE }, { status: 403 });
  }

  const claimed = claimedRows[0];

  // Defence in depth: a role stored on the invite row is still checked
  // against the invitable set before it is granted.
  if (!isInvitableRole(claimed.role_to_assign)) {
    await releaseInvite(tokenHash, user.id);
    console.error("Invite carried an unrecognised role:", claimed.role_to_assign);
    return NextResponse.json({ error: INVALID_INVITE }, { status: 403 });
  }

  const grantedRole = claimed.role_to_assign;

  /* 5. Profile. */
  const { error: profileError } = await supabaseServer
    .schema("public")
    .from("profiles")
    .upsert(
      {
        user_id: user.id,
        firstname,
        lastname,
        username,
        // Collected by the form and previously discarded here.
        ...(phone ? { phone } : {}),
      },
      { onConflict: "user_id" },
    );

  if (profileError) {
    await releaseInvite(tokenHash, user.id);
    console.error("Invite profile write failed:", profileError);

    if (profileError.code === "23505") {
      return NextResponse.json(
        { error: "That username is already taken." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to save profile" },
      { status: 500 },
    );
  }

  /* 6. Role. Skipped when the account already holds it, so redeeming does not
        create a duplicate row. */
  const { data: existingRoles } = await supabaseServer
    .schema("public")
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const alreadyHasRole = (existingRoles ?? []).some(
    (row) => row.role === grantedRole,
  );

  if (!alreadyHasRole) {
    const { error: roleError } = await supabaseServer
      .schema("public")
      .from("user_roles")
      .insert({ user_id: user.id, role: grantedRole });

    if (roleError) {
      await releaseInvite(tokenHash, user.id);
      console.error("Invite role assignment failed:", roleError);
      return NextResponse.json(
        { error: "Failed to assign role" },
        { status: 500 },
      );
    }
  }

  /* 7. Mark onboarding complete. */
  const { error: onboardingError } = await supabaseServer
    .schema("public")
    .from("onboarding_status")
    .upsert(
      {
        user_id: user.id,
        onboarded: true,
        onboarded_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  if (onboardingError) {
    // The role is granted and the profile is written, so the account works.
    // Leaving the invite consumed is correct here; only the completion flag
    // is missing, and it is recoverable.
    console.error("Invite onboarding flag failed:", onboardingError);
    return NextResponse.json(
      { error: "Failed to finalize onboarding" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    status: "ok",
    role: grantedRole,
    roleLabel: roleLabel(grantedRole),
  });
}
