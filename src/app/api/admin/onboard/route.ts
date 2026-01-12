import { NextResponse } from "next/server";
import { createClient, supabaseServer } from "@/lib/supabase/server";
import { sha256 } from "@/lib/admin";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token, form } = await req.json();

  if (!token || !form) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const tokenHash = sha256(token);

  /* 1️⃣ Validate invite */
  const { data: invite, error: inviteError } = await supabaseServer
    .schema("public")
    .from("invites")
    .select("role_to_assign")
    .eq("token_hash", tokenHash)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (inviteError || !invite) {
    return NextResponse.json(
      { error: "Invalid or expired invite" },
      { status: 403 }
    );
  }

  /* 2️⃣ Check onboarding status */
  const { data: onboarding } = await supabaseServer
    .schema("public")
    .from("onboarding_status")
    .select("onboarded")
    .eq("user_id", session.user.id)
    .single();

  if (onboarding?.onboarded) {
    return NextResponse.json({ status: "already_onboarded" });
  }

  /* 3️⃣ Consume invite */
  const { error: consumeError } = await supabaseServer
    .schema("public")
    .from("invites")
    .update({
      used_at: new Date().toISOString(),
      used_by: session.user.id,
    })
    .eq("token_hash", tokenHash)
    .is("used_at", null);

  if (consumeError) {
    return NextResponse.json(
      { error: "Failed to consume invite" },
      { status: 500 }
    );
  }

  /* 4️⃣ Upsert profile */
  const { error: profileError } = await supabaseServer
    .schema("public")
    .from("profiles")
    .upsert({
      user_id: session.user.id,
      firstname: form.firstname,
      lastname: form.lastname,
      username: form.username,
    });

  if (profileError) {
    return NextResponse.json(
      { error: "Failed to save profile" },
      { status: 500 }
    );
  }

  /* 5️⃣ Assign role */
  const { error: roleError } = await supabaseServer
    .schema("public")
    .from("user_roles")
    .insert({
      user_id: session.user.id,
      role: invite.role_to_assign,
    });

  if (roleError) {
    return NextResponse.json(
      { error: "Failed to assign role" },
      { status: 500 }
    );
  }

  /* 6️⃣ Mark onboarding complete */
  const { error: onboardingError } = await supabaseServer
    .schema("public")
    .from("onboarding_status")
    .upsert({
      user_id: session.user.id,
      onboarded: true,
      onboarded_at: new Date().toISOString(),
    });

  if (onboardingError) {
    return NextResponse.json(
      { error: "Failed to finalize onboarding" },
      { status: 500 }
    );
  }

  return NextResponse.json({ status: "ok" });
}
