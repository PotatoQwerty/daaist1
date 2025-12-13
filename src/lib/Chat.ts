"use server";
import { auth } from "@/auth";
import { supabaseServer } from "./supabase/server";

export async function getChatMessages() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  try {
    // Query the VIEW, not the table
    const { data: messages, error } = await supabaseServer
      .schema("public")
      .from("chat_messages_view")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw error;

    return messages;
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return [];
  }
}
export async function addChatMessage(message) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  try {
    const { data: messageSent, error } = await supabaseServer
      .schema("public")
      .from("messages")
      .insert(message)
      .select()
      .single();
    if (error) throw error;
    return messageSent;
  } catch (error) {
    console.error("Error adding chat message:", error);
    return null;
  }
}
