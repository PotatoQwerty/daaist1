import { NextResponse } from "next/server";
import { createClient, supabaseServer } from "@/lib/supabase/server";
import { generateInviteToken } from "@/lib/admin";

const ALLOWED_INVITE_ROLES = ["admin", "teacher"] as const;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { data: userRole } = await supabaseServer
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  const roleName = userRole?.role;

  if (roleName !== "admin" && roleName !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { role } = await req.json();

  if (!ALLOWED_INVITE_ROLES.includes(role)) {
    return NextResponse.json(
      { error: "Invalid role for invite" },
      { status: 400 },
    );
  }

  const { rawToken, hash } = generateInviteToken();
  const INVITE_EXPIRY_MS = 1000 * 60 * 60 * 24;

  const inviteLink = `${process.env.NEXT_PUBLIC_BASE_URL}/invite/${rawToken}`;

  const { error: TokenError } = await supabaseServer
    .schema("public")
    .from("invites")
    .insert({
      token_hash: hash,
      role_to_assign: role,
      created_by: user.id,
      expires_at: new Date(Date.now() + INVITE_EXPIRY_MS),
    });

  if (TokenError) {
    return NextResponse.json(
      { error: "Failed to create invite" },
      { status: 500 },
    );
  }

  return NextResponse.json({ link: inviteLink });
}
