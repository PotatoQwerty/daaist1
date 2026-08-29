import { redirect } from "next/navigation";
import { createClient, supabaseServer } from "@/lib/supabase/server";

export default async function Profile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    redirect("/");
  }

  // Fetch username directly from DB to avoid stale session data
  const { data: profile } = await supabaseServer
    .schema("public")
    .from("profiles")
    .select("username")
    .eq("user_id", user.id)
    .single();

  if (!profile?.username) {
    // If no profile found, maybe they haven't onboarded yet or something is wrong
    redirect("/");
  }

  redirect(`/profile/${profile.username}`);
}
