import { createClient, supabaseServer } from "@/lib/supabase/server";
import FilesClient from "@/components/FilesClient";
import AccessGate from "@/components/AccessGate";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { yearOptions, type LevelKey } from "@/constants/uploadConstants";

/**
 * Gated content must never be statically cached.
 *
 * This page previously had `revalidate = 3600` and never read cookies, so
 * Next rendered it once and served that one anonymous response to everybody.
 * /courses, /docs and every /api/files/* route require a session; this page
 * was the hole in that, and the cache made it worse than a plain missing
 * check.
 */
export const dynamic = "force-dynamic";

/** Only the columns the file list renders. `*` leaked internal columns. */
const COURSE_FILE_COLUMNS =
  "id, file_name, url, size, type, category, level, subject, issum, created_at, uploaded_by";

export default async function CoursesPage({
  params,
}: {
  params: Promise<{ id: string[] }>;
}) {
  const { id } = await params;
  const year = id[0];

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return (
      <AccessGate
        what="the course archive"
        redirectTo={`/courses/${encodeURIComponent(year ?? "")}`}
      />
    );
  }

  // Match the level against the known set instead of querying on whatever
  // the URL happened to contain.
  if (!yearOptions.some((option) => option.value === (year as LevelKey))) {
    notFound();
  }

  const { data: courses, error } = await supabaseServer
    .schema("public")
    .from("files")
    .select(COURSE_FILE_COLUMNS)
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
