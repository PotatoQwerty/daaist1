import { NextResponse } from "next/server";
import { createClient, supabaseServer } from "@/lib/supabase/server";
import { getUserRoles } from "@/lib/supabase/actions";

const ALLOWED_ROLES = ["admin", "super_admin", "club", "student"] as const;

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
      const profileUpdates: any = {};
      if (firstname) profileUpdates.firstname = firstname;
      if (lastname) profileUpdates.lastname = lastname;
      if (username) profileUpdates.username = username;

      const { error: profileError } = await supabaseServer
        .schema("public")
        .from("profiles")
        .update(profileUpdates)
        .eq("user_id", targetUserId);

      if (profileError) {
        return NextResponse.json(
          { error: "Failed to update profile: " + profileError.message },
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

      // Delete existing roles for this user
      const { error: deleteError } = await supabaseServer
        .schema("public")
        .from("user_roles")
        .delete()
        .eq("user_id", targetUserId);

      if (deleteError) {
        return NextResponse.json(
          { error: "Failed to delete existing roles: " + deleteError.message },
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
        return NextResponse.json(
          { error: "Failed to insert roles: " + insertError.message },
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
