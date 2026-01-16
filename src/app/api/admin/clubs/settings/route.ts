import { getUserClubRole } from "@/lib/supabase/actions";
import { createClient, supabaseServer } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const club_id = formData.get("club_id") as string;
    const description = formData.get("description") as string;
    const facebook = formData.get("facebook") as string;
    const instagram = formData.get("instagram") as string;
    const tiktok = formData.get("tiktok") as string;
    const is_active = formData.get("is_active") === "true";
    const logo_url = formData.get("logo_url") as string | null;
    const banner_url = formData.get("banner_url") as string | null;

    if (!club_id) {
      return NextResponse.json(
        { error: "Club ID is required" },
        { status: 400 },
      );
    }

    // Check authorization - must be president or vice president
    const role = await getUserClubRole(user.id, club_id);
    if (role !== "president" && role !== "vice_president") {
      return NextResponse.json(
        { error: "You don't have permission to edit this club" },
        { status: 403 },
      );
    }

    // Prepare update object
    const updates: any = {
      description,
      socials: {
        facebook: facebook || null,
        instagram: instagram || null,
        tiktok: tiktok || null,
      },
      is_active,
    };

    // Update logo URL if provided
    if (logo_url) {
      updates.logo_url = logo_url;
    }

    // Update banner URL if provided
    if (banner_url) {
      updates.banner_url = banner_url;
    }

    // Update club in database
    const { data, error } = await supabaseServer
      .schema("public")
      .from("clubs")
      .update(updates)
      .eq("id", club_id)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: `Failed to update club: ${error.message}` },
        { status: 400 },
      );
    }

    // Revalidate the club page to show updated data
    const { data: clubData } = await supabaseServer
      .schema("public")
      .from("clubs")
      .select("slug")
      .eq("id", club_id)
      .single();

    if (clubData?.slug) {
      revalidatePath(`/club/${clubData.slug}`);
    }

    return NextResponse.json(
      { message: "Club settings updated successfully", data },
      { status: 200 },
    );
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
