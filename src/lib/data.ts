import { supabaseServer } from "@/lib/supabase/server";

export async function getUserByUsername(username: string) {
  const { data, error } = await supabaseServer
    .schema("public")
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  const { data: enrollmentData } = await supabaseServer
    .schema("public")
    .from("student_enrollments")
    .select("study_year, isdaa")
    .eq("user_id", data?.user_id)
    .single();

  if (error) return null;
  return {
    ...data,
    studyyear: enrollmentData?.study_year,
    isdaa: enrollmentData?.isdaa,
  };
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
