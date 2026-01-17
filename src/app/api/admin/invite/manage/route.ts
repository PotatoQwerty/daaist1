import { createClient, supabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1️⃣ Check admin privileges via user_roles
  const { data: roles, error: roleError } = await supabaseServer
    .schema("public")
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  if (
    roleError ||
    !roles ||
    !roles.some((r) => r.role === "admin" || r.role === "super_admin")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 2️⃣ Fetch active invites
  const { data: invites, error } = await supabaseServer
    .schema("public")
    .from("invites")
    .select("id, role_to_assign, created_at, expires_at, used_at")
    .is("used_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch invites" },
      { status: 500 }
    );
  }

  return NextResponse.json({ invites });
}
