import { NextResponse } from "next/server";
import { createClient, supabaseServer } from "@/lib/supabase/server";
import { getUserRoles } from "@/lib/supabase/actions";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // This returns every profile, registration numbers included. Being signed
  // in is not enough.
  const { isAdmin, isSuperAdmin } = await getUserRoles(user.id);
  if (!isAdmin && !isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
    console.error("User list fetch failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }

  return NextResponse.json({ users: data }, { status: 200 });
}
