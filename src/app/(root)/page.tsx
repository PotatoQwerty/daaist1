import HomeClient from "@/components/HomeClient";
import HomeLoggedOut from "@/components/HomeLoggedOut";
import { isOnboarded } from "@/lib/supabase/actions";
import { createClient } from "@/lib/supabase/auth/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_NAME, absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  // `absolute` bypasses the "%s | Daa'ist" template, which would otherwise
  // render the home page as "Daa'ist | Daa'ist".
  title: { absolute: SITE_NAME },
  description: SITE_DESCRIPTION,
  alternates: { canonical: absoluteUrl("/") },
  openGraph: {
    type: "website",
    url: absoluteUrl("/"),
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
};

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) return <HomeLoggedOut />;

  const onboarded = await isOnboarded(user.id);
  if (!onboarded) redirect("/onboarding");

  return <HomeClient />;
}
