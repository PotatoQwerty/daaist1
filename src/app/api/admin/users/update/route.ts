import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { auth } from "@/auth";
import { getUserRoles } from "@/lib/supabase/actions";

const ALLOWED_ROLES = ["admin", "super_admin", "club", "student"] as const;

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { isAdmin } = await getUserRoles(session.user.id);

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { targetUserId, role, firstname, lastname, username } = body;

    if (!targetUserId) {
      return NextResponse.json(
        { error: "Target User ID is required" },
        { status: 400 }
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
          { status: 500 }
        );
      }
    }

    // Update Role
    if (role) {
      if (!ALLOWED_ROLES.includes(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }

      // Upsert role management
      // Assuming `user_roles` table: (user_id, role)
      const { error: roleError } = await supabaseServer
        .schema("public")
        .from("user_roles")
        .upsert({ user_id: targetUserId, role })
        .select();

      if (roleError) {
        return NextResponse.json(
          { error: "Failed to update role: " + roleError.message },
          { status: 500 }
        );
      }
    }

    // Fetch updated user data to return
    const { data: updatedProfile } = await supabaseServer
      .schema("public")
      .from("profiles")
      .select("*")
      .eq("user_id", targetUserId)
      .single();

    return NextResponse.json({
      user: updatedProfile,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Admin user update error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
