import { NextResponse } from "next/server";
import { createClient, supabaseServer } from "@/lib/supabase/server";
import { getUserRoles } from "@/lib/supabase/actions";
import { canAdminister } from "@/lib/roles";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * Name-and-username directory, for the "pick a person" selects.
 *
 * This exists because the club member picker and the club creation form used
 * to call the `fetchUsers` Server Action straight from the browser, which
 * handed every caller the full profile table - registration numbers included.
 * Those two screens only ever needed a label to show in a dropdown, so that
 * is all this returns.
 *
 * Deliberately NOT /api/users: that route is admin-only, and a club president
 * who is not a site admin still has to be able to add members.
 */
const DIRECTORY_COLUMNS = "user_id, firstname, lastname, username";

/** Club roles that legitimately need to look someone up to add them. */
const PICKER_CLUB_ROLES = ["president", "vice_president"];

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = enforceRateLimit(request, RATE_LIMITS.userDirectory, {
    bucket: "user-directory",
    userId: user.id,
  });
  if (limited) return limited;

  const { roles } = await getUserRoles(user.id);

  if (!canAdminister(roles)) {
    // Not a site admin, so they must run at least one club to see this.
    const { data: clubRoles, error: clubRoleError } = await supabaseServer
      .schema("public")
      .from("club_members")
      .select("id")
      .eq("user_id", user.id)
      .in("role", PICKER_CLUB_ROLES)
      .limit(1);

    if (clubRoleError) {
      console.error("Directory club-role lookup failed:", clubRoleError);
      return NextResponse.json(
        { error: "Unable to verify your permissions." },
        { status: 500 },
      );
    }

    if (!clubRoles || clubRoles.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { data: users, error } = await supabaseServer
    .schema("public")
    .from("profiles")
    .select(DIRECTORY_COLUMNS)
    // A row with no username cannot be shown in a picker anyway, and
    // filtering here keeps half-finished signups out of the response.
    .not("username", "is", null);

  if (error) {
    console.error("Directory fetch failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch the user directory" },
      { status: 500 },
    );
  }

  return NextResponse.json({ users: users ?? [] }, { status: 200 });
}
