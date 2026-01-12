import HomeClient from "@/components/HomeClient";
import { isOnboarded } from "@/lib/supabase/actions";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
export const metadata = {
  title: "Daa'ist — Home",
  description:
    "Discover courses, past exams, design resources, documents, and club activities for architecture students at the Département d’Architecture d’Alger. Daa’ist brings academic content and student creativity together in one platform.",
  keywords: [
    "architecture students",
    "daaist",
    "Daa",
    "courses",
    "past exams",
    "design resources",
    "documents",
    "Alger architecture school",
    "Département d’Architecture d’Alger",
    "student clubs",
    "architecture projects",
    "studio materials",
  ],
  alternates: { canonical: "https://daaist.com/" },
};
export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <HomeClient />;
  }
  const onboarded = await isOnboarded(user.id);

  if (!onboarded) {
    redirect("/onboarding");
  }

  return <HomeClient />;
}
