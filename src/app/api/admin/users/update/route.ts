import { NextResponse } from "next/server";
import { createClient, supabaseServer } from "@/lib/supabase/server";
import { getUserRoles } from "@/lib/supabase/actions";
import { ACCOUNT_ROLES } from "@/lib/roles";
import {
  UNIQUE_VIOLATION,
  uniqueViolationMessage,
  validateProfileFields,
} from "@/lib/profile-validation";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

// Single source of truth, shared with the invite flow and the capability
// helpers, so the two cannot drift apart again.
const ALLOWED_ROLES = ACCOUNT_ROLES;

// Granting or removing super_admin is reserved for super_admins. Without
// this an "admin" could POST {targetUserId: <self>, roles: ["super_admin"]}
// and promote themselves, or strip an existing super_admin's roles.
const SUPER_ADMIN_ONLY_ROLES = new Set(["super_admin"]);

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { isAdmin, isSuperAdmin } = await getUserRoles(user.id);

    if (!isAdmin && !isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const limited = enforceRateLimit(req, RATE_LIMITS.adminMutation, {
      bucket: "admin-user-update",
      userId: user.id,
    });
    if (limited) return limited;

    const body = await req.json();
    const { targetUserId, roles, firstname, lastname, username } = body;

    if (!targetUserId) {
      return NextResponse.json(
        { error: "Target User ID is required" },
        { status: 400 },
      );
    }

    // Update Profile Info
    if (firstname || lastname || username) {
      /* The roles branch below refuses to let a plain admin touch a
         super_admin, but this branch ran first and had no such check, so an
         admin could rename a super_admin or take their username. Same rule,
         applied to the same targets. */
      if (!isSuperAdmin) {
        const { roles: targetRoles } = await getUserRoles(targetUserId);
        if (targetRoles.some((role) => SUPER_ADMIN_ONLY_ROLES.has(role))) {
          return NextResponse.json(
            { error: "Only a super admin can edit a super admin's profile." },
            { status: 403 },
          );
        }
      }

      // Shared with /api/profile/update and the onboarding routes, so an
      // admin cannot write a username a user could not choose themselves.
      const validated = validateProfileFields({
        ...(firstname !== undefined ? { firstname } : {}),
        ...(lastname !== undefined ? { lastname } : {}),
        ...(username !== undefined ? { username } : {}),
      });

      if (!validated.ok) {
        return NextResponse.json({ error: validated.error }, { status: 400 });
      }

      const { error: profileError } = await supabaseServer
        .schema("public")
        .from("profiles")
        .update(validated.updates)
        .eq("user_id", targetUserId);

      if (profileError) {
        console.error("Admin profile update failed:", profileError);

        if (profileError.code === UNIQUE_VIOLATION) {
          return NextResponse.json(
            { error: uniqueViolationMessage(profileError.details) },
            { status: 409 },
          );
        }

        return NextResponse.json(
          { error: "Failed to update profile" },
          { status: 500 },
        );
      }
    }

    // Update Roles - roles is now an array of role strings
    if (roles && Array.isArray(roles) && roles.length > 0) {
      // Validate all roles
      for (const role of roles) {
        if (!ALLOWED_ROLES.includes(role)) {
          return NextResponse.json(
            { error: `Invalid role: ${role}` },
            { status: 400 },
          );
        }
      }

      // No editing your own roles. Closes the self-promotion path and
      // stops an admin locking themselves out mid-request.
      if (targetUserId === user.id) {
        return NextResponse.json(
          { error: "You cannot change your own roles." },
          { status: 403 },
        );
      }

      if (!isSuperAdmin) {
        if (roles.some((role: string) => SUPER_ADMIN_ONLY_ROLES.has(role))) {
          return NextResponse.json(
            { error: "Only a super admin can grant that role." },
            { status: 403 },
          );
        }

        // The write below replaces the target's roles wholesale, so an
        // admin must not be able to aim it at a super_admin.
        const { roles: targetRoles } = await getUserRoles(targetUserId);
        if (targetRoles.some((role) => SUPER_ADMIN_ONLY_ROLES.has(role))) {
          return NextResponse.json(
            { error: "Only a super admin can change a super admin's roles." },
            { status: 403 },
          );
        }
      }

      // Delete existing roles for this user
      const { error: deleteError } = await supabaseServer
        .schema("public")
        .from("user_roles")
        .delete()
        .eq("user_id", targetUserId);

      if (deleteError) {
        console.error("Role delete failed:", deleteError);
        return NextResponse.json(
          { error: "Failed to update roles" },
          { status: 500 },
        );
      }

      // Insert new roles
      const rolesToInsert = roles.map((role: string) => ({
        user_id: targetUserId,
        role,
      }));

      const { error: insertError } = await supabaseServer
        .schema("public")
        .from("user_roles")
        .insert(rolesToInsert);

      if (insertError) {
        console.error("Role insert failed:", insertError);
        return NextResponse.json(
          { error: "Failed to update roles" },
          { status: 500 },
        );
      }
    }

    // Fetch updated user data to return, including roles
    const { data: updatedProfile } = await supabaseServer
      .schema("public")
      .from("profiles")
      .select("*")
      .eq("user_id", targetUserId)
      .single();

    // Fetch updated roles
    const { data: updatedRoles } = await supabaseServer
      .schema("public")
      .from("user_roles")
      .select("role")
      .eq("user_id", targetUserId);

    return NextResponse.json({
      user: {
        ...updatedProfile,
        user_roles: updatedRoles || [],
      },
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Admin user update error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
