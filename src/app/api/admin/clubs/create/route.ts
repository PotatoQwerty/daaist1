import { getUserRoles } from "@/lib/supabase/actions";
import { createClient, supabaseServer } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
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
    const logo_url = formData.get("logo_url") as string;
    const banner_url = formData.get("banner_url") as string;
    const president_id = formData.get("president_id") as string;
    const socials = {
      facebook: formData.get("facebook") as string,
      instagram: formData.get("instagram") as string,
      tiktok: formData.get("tiktok") as string,
    };

    // Optional: Add validation
    if (
      !name ||
      !slug ||
      !description ||
      !logo_url ||
      !banner_url ||
      !president_id
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Validate URL format (basic check)
    const MAX_URL_LENGTH = 2048;
    if (
      logo_url.length > MAX_URL_LENGTH ||
      banner_url.length > MAX_URL_LENGTH
    ) {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 },
      );
    }

    // 4. Insert into database
    const { data, error } = await supabaseServer
      .schema("public")
      .from("clubs")
      .insert({
        id: randomUUID(),
        name,
        slug,
        description,
        socials: socials,
        logo_url,
        banner_url,
        is_active,
        created_by: user.id,
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
      { status: 500 },
    );
  }
}
