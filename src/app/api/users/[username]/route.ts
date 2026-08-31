import { NextResponse } from "next/server";
import { createClient, supabaseServer } from "@/lib/supabase/server";
import { getUserRoles } from "@/lib/supabase/actions";
import { canAdminister } from "@/lib/roles";

/**
 * Look up a single user record by username.
 *
 * This had no authentication of any kind: it queried with the service-role
 * client, selected every column, and returned the raw PostgREST error text
 * to anonymous callers. It is now gated the same way /api/users is, since
 * it exposes the same class of data.
 *
 * Note that it reads a `users` table which is not in the current schema
 * (see sql/2026-08-29-schema-hardening.sql) and no client code calls it, so
 * it is very likely dead. It is left in place and secured rather than
 * deleted, because that can be confirmed against the database first:
 *
 *   SELECT to_regclass('public.users');   -- NULL => safe to remove
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const supabase = await createClient();
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();

  if (!viewer?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roles } = await getUserRoles(viewer.id);
  if (!canAdminister(roles)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: user, error } = await supabaseServer
    .from("users")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (error) {
    // The raw message named the table and the schema cache state. Keep it
    // in the logs, not in the response.
    console.error("User lookup failed:", error);
    return NextResponse.json(
      { error: "Unable to look up that user" },
      { status: 500 }
    );
  }

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}
