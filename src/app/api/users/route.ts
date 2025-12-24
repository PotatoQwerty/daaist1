import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { getUserRoles } from "@/lib/supabase/actions";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { isAdmin } = await getUserRoles(session.user.id);
  if (!isAdmin) {
    return NextResponse.json(
      { error: "You do not have permission to do this action" },
      { status: 403 }
    );
  }

  const { data, error } = await supabaseServer.from("profiles").select(`
      user_id,
      firstname,
      lastname,
      username,
      registration_number,
      user_roles (
        role
      ),
      student_enrollments (
        study_year,
        isdaa,
        created_at
      )
    `);

  if (error) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch users" },
      { status: 500 }
    );
  }

  return NextResponse.json({ users: data }, { status: 200 });
}
