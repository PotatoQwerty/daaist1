/**
 * Not a Server Action module.
 *
 * `saveUserProfile` takes the user as an argument and upserts `profiles`
 * keyed on `user.id` with the service-role client, without checking the
 * session. Under `"use server"` that was one client-component import away
 * from being a public "overwrite any profile" endpoint - it registered no
 * action only because nothing currently imports this file.
 *
 * Same treatment as supabase/actions.ts: server-only, so a client import is
 * a build error rather than a live endpoint. If either function is ever
 * needed from the browser, it needs a route that derives the user from the
 * session instead of taking it as a parameter.
 */
import "server-only";

import { createClient, supabaseServer } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
export async function getUserSession() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}
export async function saveUserProfile(user: User) {
  try {
    const { error } = await supabaseServer
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
