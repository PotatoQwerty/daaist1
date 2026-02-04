import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/auth/server";
import { getUserData } from "@/lib/supabase/actions";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userData = await getUserData(user.id);

  return NextResponse.json({
    session: { user },
    user: userData.user,
    roles: userData.roles,
    isAdmin: userData.isAdmin,
    isSuperAdmin: userData.isSuperAdmin,
  });
}
