"use server";
import { createClient } from "./supabase/auth/server";
import { supabaseServer } from "./supabase/server";

export async function getChatMessages() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      if (authError) {
        console.error("Error fetching chat user:", authError);
      }
      return null;
    }

    const { data: enrollment, error: enrollmentError } = await supabaseServer
      .schema("public")
      .from("student_enrollments")
      .select("isdaa")
      .eq("user_id", user.id)
      .single();

    if (enrollmentError && enrollmentError.code !== "PGRST116") {
      console.error("Error checking chat enrollment:", enrollmentError);
      return null;
    }

    if (!enrollment?.isdaa) return null;

    const { data: messages, error } = await supabaseServer
      .schema("public")
      .from("messages")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw error;

    return messages ?? [];
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return null;
  }
}
export async function addChatMessage(message: {
  content: string;
}) {
  const content = message.content.trim();
  if (!content) return null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      if (authError) {
        console.error("Error fetching chat user:", authError);
      }
      return null;
    }

    const { data: enrollment, error: enrollmentError } = await supabaseServer
      .schema("public")
      .from("student_enrollments")
      .select("isdaa")
      .eq("user_id", user.id)
      .single();

    if (enrollmentError && enrollmentError.code !== "PGRST116") {
      console.error("Error checking chat enrollment:", enrollmentError);
      return null;
    }

    if (!enrollment?.isdaa) return null;

    const { data: profile, error: profileError } = await supabaseServer
      .schema("public")
      .from("profiles")
      .select("username, image")
      .eq("user_id", user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("Error fetching chat profile:", profileError);
      return null;
    }

    const userImage =
      profile?.image || user.user_metadata?.avatar_url || "/assets/pdp.jpg";
    const userUsername =
      profile?.username ||
      user.user_metadata?.username ||
      user.email?.split("@")[0] ||
      "student";

    const { data: messageSent, error } = await supabaseServer
      .schema("public")
      .from("messages")
      .insert({
        content,
        user_id: user.id,
        user_image: userImage,
        user_username: userUsername,
      })
      .select()
      .single();
    if (error) throw error;
    return messageSent;
  } catch (error) {
    console.error("Error adding chat message:", error);
    return null;
  }
}
