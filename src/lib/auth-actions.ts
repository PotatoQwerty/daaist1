"use server";

import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
export async function getUserSession() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}
export async function saveUserProfile(user: User) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .schema("public")
      .from("profiles")
      .upsert(
        {
          user_id: user.id,
          email: user.email,
          firstname: user.user_metadata?.first_name || "",
          lastname: user.user_metadata?.last_name || "",
          image: user.user_metadata?.avatar_url || null,
          // username will be set during onboarding
        },
        { onConflict: "user_id" }
      );

    if (error) {
      console.error("Error saving user profile:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error saving user profile:", error);
    return { success: false, error: "Failed to save user profile" };
  }
}
