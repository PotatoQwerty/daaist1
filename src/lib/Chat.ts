"use server";
import { headers } from "next/headers";
import { createClient } from "./supabase/auth/server";
import { supabaseServer } from "./supabase/server";
import { enforceRateLimit, RATE_LIMITS } from "./rate-limit";

/**
 * Longest message the shared chat accepts.
 *
 * There was no ceiling at all: `content` was trimmed for emptiness and
 * inserted. Comfortably above a normal message, well below anything that
 * would bloat the table or the payload every reader downloads.
 */
const MAX_MESSAGE_LENGTH = 1000;

/**
 * How much history a reader gets.
 *
 * getChatMessages selected the whole table with no limit, so every open of
 * the chat downloaded every message ever sent and that cost grew forever.
 * The newest slice is fetched and then flipped back into chronological
 * order, so the rendering is unchanged.
 */
const CHAT_HISTORY_LIMIT = 100;

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
      .order("created_at", { ascending: false })
      .limit(CHAT_HISTORY_LIMIT);

    if (error) throw error;

    // Fetched newest-first to get the most recent slice, then reversed so
    // callers still receive oldest-first as before.
    return (messages ?? []).slice().reverse();
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return null;
  }
}
export async function addChatMessage(message: {
  content: string;
}) {
  const content = typeof message?.content === "string"
    ? message.content.trim()
    : "";
  if (!content) return null;
  if (content.length > MAX_MESSAGE_LENGTH) return null;

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

    /* Server Actions have no Request object, so the limiter is handed the
       incoming headers. It keys on the user id anyway; the headers only
       matter for the IP fallback, which cannot be reached here because this
       point is past the auth check. */
    const limited = enforceRateLimit(
      new Request("https://daaist.com/chat", { headers: await headers() }),
      RATE_LIMITS.chatPost,
      { bucket: "chat-post", userId: user.id },
    );
    if (limited) return null;

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
