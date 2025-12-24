"use server";
import { supabaseServer } from "./server";

export async function isOnboarded(userId: string) {
  const { data: isOnboarded, error } = await supabaseServer
    .schema("public")
    .from("onboarding_status")
    .select("onboarded")
    .eq("user_id", userId);

  if (error) {
    console.error("Error checking onboarding status:", error);
    return false;
  }
  return isOnboarded?.[0]?.onboarded ?? false;
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
  const isAdmin = roles.includes("admin") || roles.includes("super_admin");

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
  };
}

export async function getUserRoles(userId: string) {
  const { roles, isAdmin } = await getUserData(userId);
  return { roles, isAdmin };
}
