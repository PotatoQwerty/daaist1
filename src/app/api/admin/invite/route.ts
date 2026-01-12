import { NextResponse } from "next/server";
import { createClient, supabaseServer } from "@/lib/supabase/server";
import { generateInviteToken } from "@/lib/admin";

const ALLOWED_INVITE_ROLES = ["admin", "teacher"] as const;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  // Only admins can create invites
  // NOTE: Ideally you should fetch user role from DB here to be secure
  // Assuming 'role' is in metadata or you trust session for now (or fix it properly by fetching)
  // But for now, let's keep logic similar but using Supabase session
  // Actually, standard practice: fetch role or allow RLS to handle it.
  // Since this is an admin route, let's assume we might need to fetch role if it's not in session metadata.
  // The original code accessed `session.user.role`. Supabase session user object doesn't have 'role' by default at top level unless custom.
  // Let's check user_roles table properly.

  const { data: userRole } = await supabaseServer
    .from("user_roles")
    .select("role")
    .eq("user_id", session.user.id)
    .single();

  const roleName = userRole?.role;

  if (roleName !== "admin" && roleName !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { role } = await req.json();

  if (!ALLOWED_INVITE_ROLES.includes(role)) {
    return NextResponse.json(
      { error: "Invalid role for invite" },
      { status: 400 }
    );
  }

  const { rawToken, hash } = generateInviteToken();
  const INVITE_EXPIRY_MS = 1000 * 60 * 60 * 24;

  const inviteLink = `${process.env.NEXT_PUBLIC_BASE_URL}/invite/${rawToken}`;

  const { error } = await supabaseServer
    .schema("public")
    .from("invites")
    .insert({
      token_hash: hash,
      role_to_assign: role,
      created_by: session.user.id,
      expires_at: new Date(Date.now() + INVITE_EXPIRY_MS),
    });

  if (error) {
    return NextResponse.json(
      { error: "Failed to create invite" },
      { status: 500 }
    );
  }

  return NextResponse.json({ link: inviteLink });
}
