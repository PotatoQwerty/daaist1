"use server";
import { supabaseServer } from "./server";

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
