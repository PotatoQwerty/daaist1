import HomeClient from "@/components/HomeClient";

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

export default function HomePage() {
  // server-rendered head + SSR metadata; client UI stays client-only
  return <HomeClient />;
}
