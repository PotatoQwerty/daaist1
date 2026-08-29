import { NextResponse } from "next/server";
import { createClient, supabaseServer } from "@/lib/supabase/server";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limited = enforceRateLimit(req, RATE_LIMITS.profileUpdate, {
      bucket: "profile-update",
      userId: user.id,
    });
    if (limited) return limited;

    const { bio, firstname, lastname, phone, image, username } =
      await req.json();

    const updateData: any = {};
    if (bio !== undefined) updateData.bio = bio;
    if (firstname !== undefined) updateData.firstname = firstname;
    if (lastname !== undefined) updateData.lastname = lastname;
    if (phone !== undefined) updateData.phone = phone;
    if (image !== undefined) updateData.image = image;
    if (username !== undefined) updateData.username = username;

    const { data, error: updateError } = await supabaseServer
      .schema("public")
      .from("profiles")
      .update(updateData)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Profile update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ user: data });
  } catch (updateError) {
    console.error("Profile update internal error:", updateError);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
