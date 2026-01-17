import { supabaseServer } from "@/lib/supabase/server";

export async function getUserByUsername(username: string) {
  const { data, error } = await supabaseServer
    .schema("public")
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (error || !data) return null;

  const resolvedUserId = data.user_id || data.id;
  if (!resolvedUserId) return null;

  const { data: enrollmentData } = await supabaseServer
    .schema("public")
    .from("student_enrollments")
    .select("study_year, isdaa")
    .eq("user_id", resolvedUserId)
    .single();

  return {
    ...data,
    user_id: resolvedUserId,
    studyyear: enrollmentData?.study_year,
    isdaa: enrollmentData?.isdaa,
  };
}

export async function getUserByUserId(userId: string) {
  const { data, error } = await supabaseServer
    .schema("public")
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  let profile = data;
  let profileError = error;

  if (profileError || !profile) {
    const fallback = await supabaseServer
      .schema("public")
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    profile = fallback.data;
    profileError = fallback.error;
  }

  if (profileError || !profile) return null;

  const resolvedUserId = profile.user_id || profile.id;
  if (!resolvedUserId) return null;

  const { data: enrollmentData } = await supabaseServer
    .schema("public")
    .from("student_enrollments")
    .select("study_year, isdaa")
    .eq("user_id", resolvedUserId)
    .single();

  return {
    ...profile,
    user_id: resolvedUserId,
    studyyear: enrollmentData?.study_year,
    isdaa: enrollmentData?.isdaa,
  };
}

export async function getUserByChatUsername(username: string) {
  const { data, error } = await supabaseServer
    .schema("public")
    .from("messages")
    .select("user_id")
    .eq("user_username", username)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data?.user_id) return null;
  return getUserByUserId(data.user_id);
}

export async function getFilesByUserId(userId: string) {
  const { data, error } = await supabaseServer
    .schema("public")
    .from("files")
    .select("*")
    .eq("uploaded_by", userId);

  if (error) return [];
  return data;
}

export async function getLikedFiles(userId: string) {
  const { data, error } = await supabaseServer
    .schema("public")
    .from("likes")
    .select(
      `
      id,
      created_at,
      files (
        id,
        file_name,
        url,
        size,
        type,
        subject,
        category
      )
    `
    )
    .eq("user_id", userId);

  if (error) return [];
  return data.map((like: any) => like.files);
}

export async function getUserClubsByUserId(userId: string) {
  const { data, error } = await supabaseServer
    .schema("public")
    .from("club_members")
    .select(
      `
      club_id,
      role,
      clubs (
        id,
        name,
        slug,
        logo_url
      )
    `
    )
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching club memberships:", error);
    return [];
  }

  return (
    data
      ?.map((member: any) => {
        const club = member.clubs;
        const clubId = club?.id ?? member.club_id ?? club?.name;
        if (!club?.name || !clubId) return null;
        return {
          id: String(clubId),
          name: club.name,
          slug: club.slug,
          logo_url: club.logo_url,
          role: member.role,
        };
      })
      .filter(Boolean) ?? []
  );
}
