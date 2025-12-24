import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export default async function ProfileRedirectPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  // Fetch username directly from DB to avoid stale session data
  const { data: profile } = await supabaseServer
    .schema("public") // explicit schema is good practice as seen in your other files
    .from("profiles")
    .select("username")
    .eq("user_id", session.user.id)
    .single();

  if (!profile?.username) {
    // If no profile found, maybe they haven't onboarded yet or something is wrong
    // Redirecting to home or potentially onboarding check could go here
    redirect("/");
  }

  redirect(`/profile/${profile.username}`);
}
