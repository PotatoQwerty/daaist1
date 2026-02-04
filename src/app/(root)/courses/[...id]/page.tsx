import { supabaseServer } from "@/lib/supabase/server";
import FilesClient from "@/components/FilesClient";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

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

  return (
    <main className="relative min-h-screen w-full bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-background to-accent/10" />
        <div className="absolute -top-40 right-0 h-[520px] w-[520px] rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-40 left-0 h-[520px] w-[520px] rounded-full bg-accent/15 blur-3xl" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="shrink-0 rounded-full"
          >
            <Link href="/courses" aria-label="Back to course years">
              <ChevronLeft className="size-5" />
            </Link>
          </Button>

          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
              Courses
            </p>
            <h1 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              {year}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse resources and materials for {year}
            </p>
          </div>
        </header>

        <FilesClient initialFiles={courses || []} level={year} />
      </div>
    </main>
  );
}
