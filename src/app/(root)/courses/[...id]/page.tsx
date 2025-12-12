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
    <div className="flex flex-col w-full min-h-screen p-6 bg-background space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href="/courses">
            <ChevronLeft className="size-5" />
          </Link>
        </Button>
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {year}
          </h1>
          <p className="text-muted-foreground">
            Browse resources and materials for {year}
          </p>
        </div>
      </div>
      <FilesClient initialFiles={courses || []} level={year} />
    </div>
  );
}
