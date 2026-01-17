import { NextResponse } from "next/server";
import { createClient, supabaseServer } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import { getUserClubRole } from "@/lib/supabase/actions";

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const club_id = searchParams.get("club_id");

  if (!club_id) {
    return NextResponse.json({ error: "Club ID is required" }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("events")
    .select("*")
    .eq("club_id", club_id)
    .order("start_date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 200 });
};

export const POST = async (request: Request) => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const formData = await request.formData();

  const club_id = formData.get("club_id") as string;
  if (!club_id) {
    return NextResponse.json({ error: "Club ID is required" }, { status: 400 });
  }

  const role = await getUserClubRole(user.id, club_id);
  const isPresident = role === "president";
  const isVicePresident = role === "vice_president";
  const isEventManager = role === "event_manager";

  const canManageEvents = isPresident || isVicePresident || isEventManager;

  if (!canManageEvents) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;
    const location = formData.get("location") as string | null;
    const start_date = formData.get("start_date") as string;
    const end_date = formData.get("end_date") as string;
    const is_public = formData.get("is_public") === "true";
    const file = formData.get("file") as File | null;
    const id = randomUUID();
    if (!club_id || !title || !start_date || !end_date || !file) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const bannerFileName = `clubs/events/${id}`;

    const { error: uploadError } = await supabase.storage
      .from("daa")
      .upload(bannerFileName, file, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: bannerData } = supabase.storage
      .from("daa")
      .getPublicUrl(bannerFileName);

    if (!bannerData?.publicUrl) {
      return NextResponse.json(
        { error: "Failed to get event banner URL" },
        { status: 500 }
      );
    }

    const { data, error } = await supabaseServer
      .from("events")
      .insert({
        club_id,
        title,
        description,
        location,
        start_date,
        end_date,
        cover_image: bannerData.publicUrl,
        is_public,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
};

export const DELETE = async (request: Request) => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const event_id = searchParams.get("event_id");

    if (!event_id) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    // 2. Delete from Database FIRST
    const { error: dbError } = await supabaseServer
      .from("events")
      .delete()
      .eq("id", event_id);

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // 3. If DB delete successful, delete from Storage
    const { error: storageError } = await supabase.storage
      .from("daa")
      .remove([`clubs/events/${event_id}`]);

    // If storage fails, we might just log it, but the event is gone from the app, which is good.
    if (storageError) {
      console.error(
        "Failed to cleanup storage for event:",
        event_id,
        storageError
      );
      // We can still return success to the client because the event is "deleted" from their perspective.
    }

    return NextResponse.json(
      { message: "Event deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
};
