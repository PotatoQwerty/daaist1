import { createClient, supabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { canAdminister, roleLabel } from "@/lib/roles";

/** Resolves the caller and confirms they may administer invites. */
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.id) {
    return {
      user: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: roleRows, error: roleError } = await supabaseServer
    .schema("public")
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  if (roleError) {
    console.error("Invite admin check failed:", roleError);
    return {
      user: null,
      response: NextResponse.json(
        { error: "Unable to verify your permissions." },
        { status: 500 },
      ),
    };
  }

  if (!canAdminister((roleRows ?? []).map((row) => row.role))) {
    return {
      user: null,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { user, response: null };
}

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  // Unredeemed invites only. Expired ones stay in the response and are
  // flagged, because an admin needs to see that a link they sent has run out
  // rather than have it silently disappear.
  const { data: invites, error } = await supabaseServer
    .schema("public")
    .from("invites")
    .select("id, role_to_assign, created_at, expires_at, used_at")
    .is("used_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Invite listing failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch invites" },
      { status: 500 },
    );
  }

  const now = Date.now();
  const decorated = (invites ?? []).map((invite) => ({
    ...invite,
    role_label: roleLabel(invite.role_to_assign),
    expired: new Date(invite.expires_at).getTime() <= now,
  }));

  return NextResponse.json({ invites: decorated });
}

/**
 * Revoke an unredeemed invite.
 *
 * The link is the only copy of the token, so once it has been sent there was
 * previously no way to take it back. Deleting the row makes any outstanding
 * link fail validation immediately.
 */
export async function DELETE(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  let body: { id?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const id = typeof body.id === "string" ? body.id.trim() : "";

  if (!id) {
    return NextResponse.json(
      { error: "An invite id is required." },
      { status: 400 },
    );
  }

  // Scoped to unredeemed invites: a consumed one is an audit record and is
  // not deletable through this route.
  const { data: revoked, error } = await supabaseServer
    .schema("public")
    .from("invites")
    .delete()
    .eq("id", id)
    .is("used_at", null)
    .select("id");

  if (error) {
    console.error("Invite revoke failed:", error);
    return NextResponse.json(
      { error: "Unable to revoke this invite." },
      { status: 500 },
    );
  }

  if (!revoked || revoked.length === 0) {
    return NextResponse.json(
      { error: "That invite no longer exists, or has already been used." },
      { status: 404 },
    );
  }

  return NextResponse.json({ revoked: revoked[0].id }, { status: 200 });
}
