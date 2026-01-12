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
    const logoFile = formData.get("logo") as File | null;
    const bannerFile = formData.get("banner") as File | null;

    if (!club_id) {
      return NextResponse.json(
        { error: "Club ID is required" },
        { status: 400 }
      );
    }

    // Check authorization - must be president or vice president
    const role = await getUserClubRole(user.id, club_id);
    if (role !== "president" && role !== "vice_president") {
      return NextResponse.json(
        { error: "You don't have permission to edit this club" },
        { status: 403 }
      );
    }

    // Get current club data to retrieve old image URLs and slug
    const { data: currentClub } = await supabaseServer
      .schema("public")
      .from("clubs")
      .select("logo_url, banner_url, slug")
      .eq("id", club_id)
      .single();

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

    // Helper function to extract file path from Supabase URL
    const extractFilePath = (url: string | null): string | null => {
      if (!url) return null;
      try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split("/daa/");
        return pathParts[1] || null;
      } catch {
        return null;
      }
    };

    // Handle logo upload
    if (logoFile && logoFile.size > 0) {
      // Delete old logo if exists
      if (currentClub?.logo_url) {
        const oldLogoPath = extractFilePath(currentClub.logo_url);
        if (oldLogoPath) {
          await supabaseServer.storage.from("daa").remove([oldLogoPath]);
        }
      }

      const logoFileName = `clubs/logo/${club_id}-${randomUUID()}-${
        logoFile.name
      }`;
      const { error: logoErr } = await supabaseServer.storage
        .from("daa")
        .upload(logoFileName, logoFile, {
          contentType: logoFile.type,
          upsert: true,
        });

      if (logoErr) {
        return NextResponse.json(
          { error: `Logo upload failed: ${logoErr.message}` },
          { status: 500 }
        );
      }

      const { data: logoUrl } = supabaseServer.storage
        .from("daa")
        .getPublicUrl(logoFileName);

      if (logoUrl) {
        updates.logo_url = logoUrl.publicUrl;
      }
    }

    // Handle banner upload
    if (bannerFile && bannerFile.size > 0) {
      // Delete old banner if exists
      if (currentClub?.banner_url) {
        const oldBannerPath = extractFilePath(currentClub.banner_url);
        if (oldBannerPath) {
          await supabaseServer.storage.from("daa").remove([oldBannerPath]);
        }
      }

      const bannerFileName = `clubs/banner/${club_id}-${randomUUID()}-${
        bannerFile.name
      }`;
      const { error: bannerErr } = await supabaseServer.storage
        .from("daa")
        .upload(bannerFileName, bannerFile, {
          contentType: bannerFile.type,
          upsert: true,
        });

      if (bannerErr) {
        return NextResponse.json(
          { error: `Banner upload failed: ${bannerErr.message}` },
          { status: 500 }
        );
      }

      const { data: bannerUrl } = supabaseServer.storage
        .from("daa")
        .getPublicUrl(bannerFileName);

      if (bannerUrl) {
        updates.banner_url = bannerUrl.publicUrl;
      }
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
        { status: 400 }
      );
    }

    // Revalidate the club page to show updated data
    if (currentClub?.slug) {
      revalidatePath(`/club/${currentClub.slug}`);
    }

    return NextResponse.json(
      { message: "Club settings updated successfully", data },
      { status: 200 }
    );
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
