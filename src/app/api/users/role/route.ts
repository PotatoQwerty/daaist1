import { auth } from "@/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseServer
    .from("user_roles")
    .select("role")
    .eq("user_id", session.user.id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch role" },
      { status: 500 }
    );
  }

  const roles = data.map((r) => r.role);
  const isAdmin = roles.includes("admin") || roles.includes("super_admin");

  return NextResponse.json({ roles, isAdmin });
}
