import { getUserRoles } from "@/lib/supabase/actions";
import { createClient, supabaseServer } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // 1. Check authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Check authorization
    const { isSuperAdmin } = await getUserRoles(user.id);
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Parse and validate request body
    const formData = await request.formData();

    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const description = formData.get("description") as string;
    const is_active = formData.get("is_active") === "true";
    const logoFile = formData.get("logoFile") as File | null;
    const bannerFile = formData.get("bannerFile") as File | null;
    const president_id = formData.get("president_id") as string;

    // Optional: Add validation
    if (
      !name ||
      !slug ||
      !description ||
      !logoFile ||
      !bannerFile ||
      !president_id
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const logoFileName = `clubs/logo/${randomUUID()}-${logoFile.name}`;
    const { error: logoErr } = await supabaseServer.storage
      .from("daa")
      .upload(logoFileName, logoFile, {
        contentType: logoFile.type,
        upsert: true,
      });
    if (logoErr)
      return NextResponse.json({ message: logoErr.message }, { status: 500 });
    const bannerFileName = `clubs/banner/${randomUUID()}-${bannerFile.name}`;
    const { error: bannerErr } = await supabaseServer.storage
      .from("daa")
      .upload(bannerFileName, bannerFile, {
        contentType: bannerFile.type,
        upsert: true,
      });
    if (bannerErr)
      return NextResponse.json({ message: bannerErr.message }, { status: 500 });
    const { data: logoUrl } = supabaseServer.storage
      .from("daa")
      .getPublicUrl(logoFileName);
    if (!logoUrl)
      return NextResponse.json(
        {
          message: `Couldn't fetch Logo Url`,
        },
        { status: 500 }
      );
    const { data: bannerUrl } = supabaseServer.storage
      .from("daa")
      .getPublicUrl(bannerFileName);

    if (!bannerUrl)
      return NextResponse.json(
        { message: `Couldn't fetch banner Url` },
        { status: 500 }
      );
    // 4. Insert into database
    const { data, error } = await supabaseServer
      .schema("public")
      .from("clubs")
      .insert({
        id: randomUUID(),
        name,
        slug,
        description,
        logo_url: logoUrl.publicUrl,
        banner_url: bannerUrl.publicUrl,
        is_active,
        created_by: session.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // 5. Assign President
    const { error: memberError } = await supabaseServer
      .from("club_members")
      .insert({
        club_id: data.id,
        user_id: president_id,
        role: "president",
      });

    if (memberError) {
      console.error("Failed to assign president:", memberError);
      // We return success for club creation, but log the error.
      // Ideally we would rollback or handle this better.
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
