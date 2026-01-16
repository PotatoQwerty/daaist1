"use server";
import { createClient } from "./supabase/auth/server";
import { supabaseServer } from "./supabase/server";

export async function getChatMessages() {
  // const supabase = await createClient();
  // const { data: user } = await supabase.auth.getUser();

  // if (!user?.user) {
  //   throw new Error("Unauthorized");
  // }

  try {
    // Query the VIEW, not the table
    const { data: messages, error } = await supabaseServer
      .schema("public")
      .from("messages")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw error;

    return messages;
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return [];
  }
}
export async function addChatMessage(message: {
  content: string;
  user_id: string;
  user_image: string;
  user_username: string;
}) {
  //   const session = await auth.api.getSession({
  //     headers: await headers()
  // })
  // if (!session?.user || !session.user.isdaa) {
  //   throw new Error("Unauthorized");
  // }

  try {
    const { data: messageSent, error } = await supabaseServer
      .schema("public")
      .from("messages")
      .insert({
        content: message.content,
        user_id: message.user_id,
        user_image: message.user_image,
        user_username: message.user_username,
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
