import { supabaseServer } from "@/lib/supabase/server";

export async function getUserByUsername(username: string) {
  const { data, error } = await supabaseServer
    .from("users")
    .select("*")
    .eq("username", username)
    .single();

  if (error) return null;
  return data;
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
        subject
      )
    `
    )
    .eq("user_id", userId);

  if (error) return [];
  return data.map((like: any) => like.files);
}
