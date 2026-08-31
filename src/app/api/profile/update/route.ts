import { NextResponse } from "next/server";
import { createClient, supabaseServer } from "@/lib/supabase/server";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import {
  UNIQUE_VIOLATION,
  uniqueViolationMessage,
  validateProfileFields,
} from "@/lib/profile-validation";

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

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    /* Every field used to be written through exactly as received, so the
       username rules the signup form advertises were skippable by posting
       here directly, `image` could be set to any string, and bio, names and
       phone had no server-side length at all. */
    const validated = validateProfileFields({
      bio: body.bio,
      firstname: body.firstname,
      lastname: body.lastname,
      phone: body.phone,
      image: body.image,
      username: body.username,
    });

    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const updateData = validated.updates;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update." },
        { status: 400 },
      );
    }

    const { data, error: updateError } = await supabaseServer
      .schema("public")
      .from("profiles")
      .update(updateData)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Profile update error:", updateError);

      // A taken username is a 409 the user can act on, not a 500 carrying
      // the raw Postgres constraint text.
      if (updateError.code === UNIQUE_VIOLATION) {
        return NextResponse.json(
          { error: uniqueViolationMessage(updateError.details) },
          { status: 409 },
        );
      }

      return NextResponse.json(
        { error: "Could not update your profile." },
        { status: 500 },
      );
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
