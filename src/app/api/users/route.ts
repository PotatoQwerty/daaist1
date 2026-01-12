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
