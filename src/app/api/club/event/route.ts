import { NextResponse } from "next/server";
import { createClient, supabaseServer } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import { getEventByEventId, getUserClubRole } from "@/lib/supabase/actions";

const serializeSupabaseError = (error: unknown) => {
  if (!error || typeof error !== "object") return error;

  const err = error as {
    message?: string;
    details?: string;
    hint?: string;
    code?: string;
    name?: string;
    stack?: string;
  };

  return {
    name: err.name,
    message: err.message,
    details: err.details,
    hint: err.hint,
    code: err.code,
    stack: err.stack,
  };
};

const getStoragePathFromPublicUrl = (coverImage?: string | null) => {
  if (!coverImage) return null;

  const publicPrefix = "/storage/v1/object/public/daa/";
  const prefixIndex = coverImage.indexOf(publicPrefix);
  if (prefixIndex >= 0) {
    return coverImage.slice(prefixIndex + publicPrefix.length);
  }

  try {
    const url = new URL(coverImage);
    const pathIndex = url.pathname.indexOf(publicPrefix);
    if (pathIndex >= 0) {
      return decodeURIComponent(
        url.pathname.slice(pathIndex + publicPrefix.length),
      );
    }
  } catch {
    return null;
  }

  return null;
};

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const club_id = searchParams.get("club_id");

  if (!club_id) {
    return NextResponse.json({ error: "Club ID is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = await getUserClubRole(user.id, club_id);
  const canManageEvents =
    role === "president" ||
    role === "vice_president" ||
    role === "event_manager";

  if (!canManageEvents) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
  const requestId = randomUUID();
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  console.log("[api/club/event][POST] auth lookup", {
    requestId,
    hasUser: Boolean(user),
    userId: user?.id ?? null,
    authError: serializeSupabaseError(error),
  });

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

  console.log("[api/club/event][POST] role check", {
    requestId,
    userId: user.id,
    club_id,
    role,
    canManageEvents,
  });

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

    console.log("[api/club/event][POST] parsed form", {
      requestId,
      eventId: id,
      club_id,
      userId: user.id,
      title,
      hasDescription: Boolean(description),
      location,
      start_date,
      end_date,
      is_public,
      hasFile: Boolean(file),
      fileMeta: file
        ? {
            name: file.name,
            type: file.type,
            size: file.size,
          }
        : null,
    });

    if (!club_id || !title || !start_date || !end_date || !file) {
      console.warn("[api/club/event][POST] missing required fields", {
        requestId,
        club_id,
        title,
        start_date,
        end_date,
        hasFile: Boolean(file),
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const bannerFileName = `clubs/events/${id}`;

    const { error: uploadError } = await supabaseServer.storage
      .from("daa")
      .upload(bannerFileName, file, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("[api/club/event][POST] storage upload failed", {
        requestId,
        bannerFileName,
        uploadError: serializeSupabaseError(uploadError),
      });
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: bannerData } = supabaseServer.storage
      .from("daa")
      .getPublicUrl(bannerFileName);

    console.log("[api/club/event][POST] banner uploaded", {
      requestId,
      bannerFileName,
      publicUrl: bannerData?.publicUrl ?? null,
    });

    if (!bannerData?.publicUrl) {
      console.error("[api/club/event][POST] missing public URL after upload", {
        requestId,
        bannerFileName,
      });
      return NextResponse.json(
        { error: "Failed to get event banner URL" },
        { status: 500 }
      );
    }

    const insertPayload = {
      id,
      club_id,
      title,
      description,
      location,
      start_date,
      end_date,
      cover_image: bannerData.publicUrl,
      is_public,
      created_by: user.id,
    };

    console.log("[api/club/event][POST] inserting event row", {
      requestId,
      eventId: id,
      insertPayload,
    });

    const { data, error } = await supabaseServer
      .from("events")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error("[api/club/event][POST] event insert failed", {
        requestId,
        eventId: id,
        userId: user.id,
        club_id,
        insertPayload,
        error: serializeSupabaseError(error),
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("[api/club/event][POST] event insert succeeded", {
      requestId,
      eventId: data?.id ?? null,
      club_id,
      userId: user.id,
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error("[api/club/event][POST] unexpected exception", {
      requestId,
      error: serializeSupabaseError(err),
    });
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

    const event = await getEventByEventId(event_id);
    if (!event?.club_id) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const role = await getUserClubRole(user.id, event.club_id);
    const canManageEvents =
      role === "president" ||
      role === "vice_president" ||
      role === "event_manager";

    if (!canManageEvents) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
    const storagePath =
      getStoragePathFromPublicUrl(event.cover_image) || `clubs/events/${event_id}`;

    const { error: storageError } = await supabaseServer.storage
      .from("daa")
      .remove([storagePath]);

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
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
};
