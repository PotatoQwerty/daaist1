import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { parseEventExtraData } from "@/lib/event-extra";
import { getEventByEventId, getUserClubRole } from "@/lib/supabase/actions";
import { createClient, supabaseServer } from "@/lib/supabase/server";

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

const getStoragePathFromPublicUrl = (imageUrl?: string | null) => {
  if (!imageUrl) return null;

  const publicPrefix = "/storage/v1/object/public/daa/";
  const prefixIndex = imageUrl.indexOf(publicPrefix);
  if (prefixIndex >= 0) {
    return imageUrl.slice(prefixIndex + publicPrefix.length);
  }

  try {
    const url = new URL(imageUrl);
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

function normalizeText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function getBoolean(value: FormDataEntryValue | null) {
  return value === "true";
}

function getOptionalFile(value: FormDataEntryValue | null) {
  return value instanceof File && value.size > 0 ? value : null;
}

async function ensureManagerAccess(userId: string, clubId: string) {
  const role = await getUserClubRole(userId, clubId);
  const canManageEvents =
    role === "president" ||
    role === "vice_president" ||
    role === "event_manager";

  return { role, canManageEvents };
}

async function uploadEventImage({
  eventId,
  kind,
  file,
}: {
  eventId: string;
  kind: "banner" | "square";
  file: File;
}) {
  const storagePath = `clubs/events/${eventId}/${kind}`;

  const { error: uploadError } = await supabaseServer.storage
    .from("daa")
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return {
      publicUrl: null,
      storagePath,
      error: uploadError,
    };
  }

  const { data } = supabaseServer.storage.from("daa").getPublicUrl(storagePath);

  return {
    publicUrl: data.publicUrl,
    storagePath,
    error: null,
  };
}

async function removeStoragePaths(paths: string[]) {
  const uniquePaths = Array.from(
    new Set(paths.map((path) => path.trim()).filter(Boolean)),
  );

  if (uniquePaths.length === 0) {
    return null;
  }

  const { error } = await supabaseServer.storage.from("daa").remove(uniquePaths);
  return error;
}

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const clubId = searchParams.get("club_id");

  if (!clubId) {
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

  const { canManageEvents } = await ensureManagerAccess(user.id, clubId);

  if (!canManageEvents) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabaseServer
    .from("events")
    .select("*")
    .eq("club_id", clubId)
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
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const clubId = normalizeText(formData.get("club_id"));
    const title = normalizeText(formData.get("title"));
    const description = normalizeText(formData.get("description")) || null;
    const location = normalizeText(formData.get("location")) || null;
    const startDate = normalizeText(formData.get("start_date"));
    const endDate = normalizeText(formData.get("end_date"));
    const isPublic = getBoolean(formData.get("is_public"));
    const rawExtraData = formData.get("extra_data");
    const coverImageFile =
      getOptionalFile(formData.get("cover_image_file")) ??
      getOptionalFile(formData.get("file"));
    const squareImageFile = getOptionalFile(formData.get("square_image_file"));

    if (!clubId) {
      return NextResponse.json({ error: "Club ID is required" }, { status: 400 });
    }

    const { role, canManageEvents } = await ensureManagerAccess(user.id, clubId);

    console.log("[api/club/event][POST] role check", {
      requestId,
      userId: user.id,
      clubId,
      role,
      canManageEvents,
    });

    if (!canManageEvents) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let extraData = {};
    if (typeof rawExtraData === "string" && rawExtraData.trim()) {
      extraData = parseEventExtraData(JSON.parse(rawExtraData));
    }

    if (!title || !startDate || !endDate || !coverImageFile) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const eventId = randomUUID();
    const uploadedPaths: string[] = [];

    const bannerUpload = await uploadEventImage({
      eventId,
      kind: "banner",
      file: coverImageFile,
    });

    if (bannerUpload.error || !bannerUpload.publicUrl) {
      console.error("[api/club/event][POST] banner upload failed", {
        requestId,
        eventId,
        error: serializeSupabaseError(bannerUpload.error),
      });
      return NextResponse.json(
        { error: bannerUpload.error?.message || "Failed to upload banner." },
        { status: 500 },
      );
    }

    uploadedPaths.push(bannerUpload.storagePath);

    let squareImageUrl: string | null = null;
    if (squareImageFile) {
      const squareUpload = await uploadEventImage({
        eventId,
        kind: "square",
        file: squareImageFile,
      });

      if (squareUpload.error || !squareUpload.publicUrl) {
        console.error("[api/club/event][POST] square upload failed", {
          requestId,
          eventId,
          error: serializeSupabaseError(squareUpload.error),
        });
        await removeStoragePaths(uploadedPaths);
        return NextResponse.json(
          {
            error: squareUpload.error?.message || "Failed to upload square image.",
          },
          { status: 500 },
        );
      }

      uploadedPaths.push(squareUpload.storagePath);
      squareImageUrl = squareUpload.publicUrl;
    }

    const insertPayload = {
      id: eventId,
      club_id: clubId,
      title,
      description,
      location,
      start_date: startDate,
      end_date: endDate,
      cover_image: bannerUpload.publicUrl,
      square_image: squareImageUrl,
      is_public: isPublic,
      extra_data: extraData,
      created_by: user.id,
    };

    const { data, error } = await supabaseServer
      .from("events")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error("[api/club/event][POST] event insert failed", {
        requestId,
        eventId,
        error: serializeSupabaseError(error),
      });
      await removeStoragePaths(uploadedPaths);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("[api/club/event][POST] unexpected exception", {
      requestId,
      error: serializeSupabaseError(error),
    });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
};

export const PATCH = async (request: Request) => {
  const requestId = randomUUID();
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const eventId = normalizeText(formData.get("event_id"));
    const title = normalizeText(formData.get("title"));
    const description = normalizeText(formData.get("description")) || null;
    const location = normalizeText(formData.get("location")) || null;
    const startDate = normalizeText(formData.get("start_date"));
    const endDate = normalizeText(formData.get("end_date"));
    const isPublic = getBoolean(formData.get("is_public"));
    const rawExtraData = formData.get("extra_data");
    const removeCoverImage = getBoolean(formData.get("remove_cover_image"));
    const removeSquareImage = getBoolean(formData.get("remove_square_image"));
    const coverImageFile = getOptionalFile(formData.get("cover_image_file"));
    const squareImageFile = getOptionalFile(formData.get("square_image_file"));

    if (!eventId || !title || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const existingEvent = await getEventByEventId(eventId);
    if (!existingEvent?.club_id) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const { canManageEvents } = await ensureManagerAccess(
      user.id,
      existingEvent.club_id,
    );

    if (!canManageEvents) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let extraData = {};
    if (typeof rawExtraData === "string" && rawExtraData.trim()) {
      extraData = parseEventExtraData(JSON.parse(rawExtraData));
    }

    const pathsToRemove: string[] = [];
    let nextCoverImage = existingEvent.cover_image || null;
    let nextSquareImage = existingEvent.square_image || null;

    if (coverImageFile) {
      const bannerUpload = await uploadEventImage({
        eventId,
        kind: "banner",
        file: coverImageFile,
      });

      if (bannerUpload.error || !bannerUpload.publicUrl) {
        console.error("[api/club/event][PATCH] banner upload failed", {
          requestId,
          eventId,
          error: serializeSupabaseError(bannerUpload.error),
        });
        return NextResponse.json(
          { error: bannerUpload.error?.message || "Failed to upload banner." },
          { status: 500 },
        );
      }

      nextCoverImage = bannerUpload.publicUrl;
    } else if (removeCoverImage) {
      const oldPath =
        getStoragePathFromPublicUrl(existingEvent.cover_image) ||
        `clubs/events/${eventId}`;

      if (oldPath) {
        pathsToRemove.push(oldPath);
      }
      nextCoverImage = null;
    }

    if (squareImageFile) {
      const squareUpload = await uploadEventImage({
        eventId,
        kind: "square",
        file: squareImageFile,
      });

      if (squareUpload.error || !squareUpload.publicUrl) {
        console.error("[api/club/event][PATCH] square upload failed", {
          requestId,
          eventId,
          error: serializeSupabaseError(squareUpload.error),
        });
        return NextResponse.json(
          {
            error: squareUpload.error?.message || "Failed to upload square image.",
          },
          { status: 500 },
        );
      }

      nextSquareImage = squareUpload.publicUrl;
    } else if (removeSquareImage) {
      const oldSquarePath = getStoragePathFromPublicUrl(existingEvent.square_image);
      if (oldSquarePath) {
        pathsToRemove.push(oldSquarePath);
      }
      nextSquareImage = null;
    }

    const updatePayload = {
      title,
      description,
      location,
      start_date: startDate,
      end_date: endDate,
      cover_image: nextCoverImage,
      square_image: nextSquareImage,
      is_public: isPublic,
      extra_data: extraData,
    };

    const { data, error } = await supabaseServer
      .from("events")
      .update(updatePayload)
      .eq("id", eventId)
      .select()
      .single();

    if (error) {
      console.error("[api/club/event][PATCH] event update failed", {
        requestId,
        eventId,
        error: serializeSupabaseError(error),
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const storageError = await removeStoragePaths(pathsToRemove);
    if (storageError) {
      console.error("[api/club/event][PATCH] storage cleanup failed", {
        requestId,
        eventId,
        error: serializeSupabaseError(storageError),
      });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("[api/club/event][PATCH] unexpected exception", {
      requestId,
      error: serializeSupabaseError(error),
    });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
};

export const DELETE = async (request: Request) => {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("event_id");

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 },
      );
    }

    const event = await getEventByEventId(eventId);
    if (!event?.club_id) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const { canManageEvents } = await ensureManagerAccess(user.id, event.club_id);

    if (!canManageEvents) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: dbError } = await supabaseServer
      .from("events")
      .delete()
      .eq("id", eventId);

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    const pathsToRemove = [
      getStoragePathFromPublicUrl(event.cover_image) || `clubs/events/${eventId}`,
      getStoragePathFromPublicUrl(event.square_image),
    ]
      .filter((value): value is string => Boolean(value))
      .filter(Boolean);

    const storageError = await removeStoragePaths(pathsToRemove);

    if (storageError) {
      console.error("Failed to cleanup storage for event:", eventId, storageError);
    }

    return NextResponse.json(
      { message: "Event deleted successfully" },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
};
