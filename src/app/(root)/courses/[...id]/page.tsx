import { supabaseServer } from "@/lib/supabase/server";
import FilesClient from "@/components/FilesClient";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { yearOptions, type LevelKey } from "@/constants/uploadConstants";

export const revalidate = 3600; // Cache for 1 hour

export default async function CoursesPage({
  params,
}: {
  params: Promise<{ id: string[] }>;
}) {
  const { id } = await params;
  const year = id[0];

  const { data: courses, error } = await supabaseServer
    .schema("public")
    .from("files")
    .select("*")
    .eq("level", year);

  if (error) {
    console.error("Fetch courses error:", error);
  }

  const yearLabel =
    yearOptions.find((option) => option.value === (year as LevelKey))?.label ??
    year;
  const count = courses?.length ?? 0;

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-12 sm:px-6 md:py-16">
      <Link
        href="/courses"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        All years
      </Link>

      <PageHeader
        title={yearLabel}
        lede="Filter by subject, or narrow to summaries only."
        domain="courses"
        meta={`${count} ${count === 1 ? "file" : "files"}`}
      />

      <div className="mt-10">
        <FilesClient initialFiles={courses || []} level={year} />
      </div>
    </main>
  );
}
