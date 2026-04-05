"use server";
import { randomUUID } from "crypto";
import {
  canAttachParticipantToUser,
  canRevealParticipantCheckInToken,
} from "../event-pass-access";
import {
  getAttendanceRoleLabel,
  normalizeAttendanceRole,
} from "../event-extra";
import { supabaseServer } from "./server";
import { getEventSlug, isEventUuid } from "../event-path";

export async function isOnboarded(userId: string) {
  const { data, error } = await supabaseServer
    .schema("public")
    .from("onboarding_status")
    .select("onboarded")
    .eq("user_id", userId);

  if (error) {
    console.error("Error checking onboarding status:", error);
    return false;
  }

  return data?.[0]?.onboarded ?? false;
}

// Keep existing getUserRoles for backward compatibility or refactor it to use getUserData if it's cleaner.
// For now, let's just add getUserData to fetch more info.

export async function getUserData(userId: string) {
  const { data: profile, error: profileError } = await supabaseServer
    .schema("public")
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  const { data: rolesData, error: rolesError } = await supabaseServer
    .schema("public")
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  const { data: enrollmentData } = await supabaseServer
    .schema("public")
    .from("student_enrollments")
    .select("study_year, isdaa")
    .eq("user_id", userId)
    .single();

  if (profileError && profileError.code !== "PGRST116")
    console.error("Profile fetch error:", profileError);
  if (rolesError) console.error("Roles fetch error:", rolesError);

  const roles = rolesData?.map((r) => r.role) || [];
  const isAdmin = roles.includes("admin");
  const isSuperAdmin = roles.includes("super_admin");

  const completeUser = profile
    ? {
        ...profile,
        studyyear: enrollmentData?.study_year,
        isdaa: enrollmentData?.isdaa,
      }
    : null;

  return {
    user: completeUser,
    roles,
    isAdmin,
    isSuperAdmin,
  };
}

export async function getUserRoles(userId: string) {
  const { roles, isAdmin, isSuperAdmin } = await getUserData(userId);
  return { roles, isAdmin, isSuperAdmin };
}

export async function getClubs() {
  const { data: clubs, error } = await supabaseServer
    .schema("public")
    .from("clubs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching clubs:", error);
    return [];
  }
  return clubs;
}

export async function getClubBySlug(slug: string) {
  const { data: club, error } = await supabaseServer
    .schema("public")
    .from("clubs")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("Error fetching club by slug:", error);
    return null;
  }
  return club;
}

export async function getClubById(id: string) {
  const { data: club, error } = await supabaseServer
    .schema("public")
    .from("clubs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching club by id:", error);
    return null;
  }

  return club;
}

export async function getEvents() {
  const { data, error } = await supabaseServer
    .schema("public")
    .from("events")
    .select("*")
    .order("start_date", { ascending: true });

  if (error) {
    console.error("Error fetching events:", error);
    return [];
  }
  return data ?? [];
}

export async function getPublicEvents() {
  const { data, error } = await supabaseServer
    .schema("public")
    .from("events")
    .select("*")
    .eq("is_public", true)
    .order("start_date", { ascending: true });

  if (error) {
    console.error("Error fetching public events:", error);
    return [];
  }

  return data ?? [];
}

type UserEventPassLookup = {
  userId?: string | null;
  email?: string | null;
  registrationNumber?: string | null;
};

export async function getUserEventPasses({
  userId,
  email,
  registrationNumber,
}: UserEventPassLookup) {
  const normalizedUserId = userId?.trim() || "";
  const normalizedEmail = email?.trim().toLowerCase() || "";
  const normalizedRegistrationNumber = registrationNumber?.trim() || "";

  if (!normalizedUserId) {
    return [];
  }
  const participantSelect =
    "id, event_id, user_id, email, registration_number, created_at, checked_in_at, check_in_method, check_in_token, extra_data";
  const participantIdentity = {
    userId: normalizedUserId,
    email: normalizedEmail,
    registrationNumber: normalizedRegistrationNumber,
  };

  const { data: ownedParticipants, error: ownedParticipantsError } =
    await supabaseServer
      .schema("public")
      .from("event_participants")
      .select(participantSelect)
      .eq("user_id", normalizedUserId)
      .order("created_at", { ascending: false })
      .limit(50);

  if (ownedParticipantsError) {
    console.error("Error fetching user-owned event passes:", ownedParticipantsError);
    return [];
  }

  let unclaimedParticipants:
    | Array<{
        id: string;
        event_id: string;
        user_id?: string | null;
        email?: string | null;
        registration_number: string;
        created_at?: string | null;
        checked_in_at?: string | null;
        check_in_method?: string | null;
        check_in_token?: string | null;
        extra_data?: unknown;
      }>
    | null = [];

  if (normalizedEmail || normalizedRegistrationNumber) {
    let unclaimedQuery = supabaseServer
      .schema("public")
      .from("event_participants")
      .select(participantSelect)
      .is("user_id", null)
      .order("created_at", { ascending: false })
      .limit(50);

    if (normalizedEmail && normalizedRegistrationNumber) {
      unclaimedQuery = unclaimedQuery
        .eq("email", normalizedEmail)
        .eq("registration_number", normalizedRegistrationNumber);
    } else if (normalizedEmail) {
      unclaimedQuery = unclaimedQuery.eq("email", normalizedEmail);
    } else {
      unclaimedQuery = unclaimedQuery.eq(
        "registration_number",
        normalizedRegistrationNumber,
      );
    }

    const { data, error: unclaimedParticipantsError } = await unclaimedQuery;

    if (unclaimedParticipantsError) {
      console.error(
        "Error fetching unclaimed event passes for user:",
        unclaimedParticipantsError,
      );
      return [];
    }

    unclaimedParticipants = data ?? [];
  }

  const accessibleParticipantsMap = new Map<
    string,
    {
      id: string;
      event_id: string;
      user_id?: string | null;
      email?: string | null;
      registration_number: string;
      created_at?: string | null;
      checked_in_at?: string | null;
      check_in_method?: string | null;
      check_in_token?: string | null;
      extra_data?: unknown;
    }
  >();

  [...(ownedParticipants ?? []), ...(unclaimedParticipants ?? [])]
    .filter((participant) =>
      canRevealParticipantCheckInToken(participant, participantIdentity),
    )
    .forEach((participant) => {
      if (!accessibleParticipantsMap.has(participant.id)) {
        accessibleParticipantsMap.set(participant.id, participant);
      }
    });

  const participants = Array.from(accessibleParticipantsMap.values());

  if (participants.length === 0) {
    return [];
  }

  const hydratedParticipants = await Promise.all(
    participants.map(async (participant) => {
      const updatePayload: {
        user_id?: string;
        check_in_token?: string;
      } = {};

      if (canAttachParticipantToUser(participant, participantIdentity)) {
        updatePayload.user_id = normalizedUserId;
      }

      if (!participant.check_in_token) {
        updatePayload.check_in_token = randomUUID();
      }

      if (Object.keys(updatePayload).length === 0) {
        return {
          ...participant,
          check_in_token: participant.check_in_token,
        };
      }

      const { data: updatedParticipant, error: updateError } = await supabaseServer
        .schema("public")
        .from("event_participants")
        .update(updatePayload)
        .eq("id", participant.id)
        .select(
          "id, event_id, user_id, registration_number, created_at, checked_in_at, check_in_method, check_in_token, extra_data",
        )
        .single();

      if (updateError || !updatedParticipant) {
        console.error("Error hydrating user event pass:", updateError);
        return {
          ...participant,
          check_in_token:
            updatePayload.check_in_token ?? participant.check_in_token ?? null,
          user_id: updatePayload.user_id ?? participant.user_id,
        };
      }

      return updatedParticipant;
    }),
  );

  const eventIds = Array.from(
    new Set(
      hydratedParticipants
        .map((participant) => participant.event_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  if (eventIds.length === 0) {
    return [];
  }

  const { data: events, error: eventsError } = await supabaseServer
    .schema("public")
    .from("events")
    .select(
      "id, title, description, location, start_date, end_date, cover_image, square_image, is_public",
    )
    .in("id", eventIds);

  if (eventsError) {
    console.error("Error fetching events for user passes:", eventsError);
    return [];
  }

  const eventMap = new Map((events ?? []).map((event) => [event.id, event]));

  return hydratedParticipants
    .map((participant) => {
      const event = eventMap.get(participant.event_id);
      if (!event) {
        return null;
      }

      const extraData =
        participant.extra_data &&
        typeof participant.extra_data === "object" &&
        !Array.isArray(participant.extra_data)
          ? participant.extra_data
          : {};
      const attendanceRole = normalizeAttendanceRole(
        (extraData as Record<string, unknown>).attendanceRole,
      );

      return {
        id: participant.id,
        event_id: participant.event_id,
        registration_number: participant.registration_number,
        created_at: participant.created_at,
        checked_in_at: participant.checked_in_at,
        check_in_method: participant.check_in_method,
        check_in_token: participant.check_in_token,
        attendance_role: attendanceRole,
        attendance_role_label: attendanceRole
          ? getAttendanceRoleLabel(attendanceRole)
          : null,
        event,
      };
    })
    .filter((value): value is NonNullable<typeof value> => Boolean(value));
}

export async function getPublicEventById(id: string) {
  const identifier = decodeURIComponent(id).trim();
  if (!identifier) return null;

  if (isEventUuid(identifier)) {
    const { data, error } = await supabaseServer
      .schema("public")
      .from("events")
      .select("*")
      .eq("id", identifier)
      .eq("is_public", true)
      .maybeSingle();

    if (error) {
      console.error("Error fetching public event by id:", error);
      return null;
    }

    if (data) {
      return data;
    }
  }

  const { data: events, error } = await supabaseServer
    .schema("public")
    .from("events")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching public event by slug:", error);
    return null;
  }

  return events?.find((event) => getEventSlug(event.title) === identifier) ?? null;
}

export async function getEventByEventId(id: string) {
  const identifier = decodeURIComponent(id).trim();
  if (!identifier) return null;

  if (isEventUuid(identifier)) {
    const { data, error } = await supabaseServer
      .schema("public")
      .from("events")
      .select("*")
      .eq("id", identifier)
      .maybeSingle();

    if (error) {
      console.error("Error fetching event by event id:", error);
      return null;
    }

    if (data) {
      return data;
    }
  }

  const { data: events, error } = await supabaseServer
    .schema("public")
    .from("events")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching event by slug:", error);
    return null;
  }

  return events?.find((event) => getEventSlug(event.title) === identifier) ?? null;
}

export async function getEventById(id: string) {
  const { data, error } = await supabaseServer
    .schema("public")
    .from("events")
    .select("*")
    .eq("club_id", id);

  if (error) {
    console.error("Error fetching event by slug:", error);
    return null;
  }
  return data;
}
export const fetchUsers = async () => {
  const { data: users } = await supabaseServer.schema("public").from("profiles")
    .select(`
  user_id,
  firstname,
  lastname,
  username,
  user_roles ( role ),
  student_enrollments ( study_year, isdaa ),
  registration_number
`);
  if (!users) {
    console.error("Error fetching users");
    return [];
  }
  return users;
};

export async function getUserClubRole(userId: string, clubId: string) {
  const { data, error } = await supabaseServer
    .schema("public")
    .from("club_members")
    .select("role")
    .eq("user_id", userId)
    .eq("club_id", clubId)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("Error fetching club role:", error);
    }
    return null;
  }
  return data?.role || null;
}
