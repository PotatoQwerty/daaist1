import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      bio,
      firstname,
      lastname,
      phone,
      image,
      username,
      studyyear,
      isdaa,
    } = await req.json();

    const updateData: any = {};
    if (bio !== undefined) updateData.bio = bio;
    if (firstname !== undefined) updateData.firstname = firstname;
    if (lastname !== undefined) updateData.lastname = lastname;
    if (phone !== undefined) updateData.phone = phone;
    if (image !== undefined) updateData.image = image;
    if (username !== undefined) updateData.username = username;

    // Some fields might belong to other tables if the user schema is split,
    // but based on `profiles` schema in the image, these seem to be the main ones.
    // Assuming `studyyear` and `isdaa` might be in `students` or `profiles` depending on recent changes,
    // but looking at `profiles` in the diagram, it has `firstname`, `lastname`, `username`, `bio`, `phone`, `image`.
    // We will stick to `profiles` table updates for now.

    const { data, error } = await supabaseServer
      .schema("public")
      .from("profiles")
      .update(updateData)
      .eq("user_id", session.user.id)
      .select()
      .single();

    if (error) {
      console.error("Profile update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ user: data });
  } catch (error) {
    console.error("Profile update internal error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
