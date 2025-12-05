import { supabaseServer } from "@/lib/supabase/server";
import FilesClient from "@/components/FilesClient";

export const revalidate = 3600; // Cache for 1 hour

export default async function CoursesPage({
  params,
}: {
  params: Promise<{ id: string[] }>;
}) {
  const { id } = await params;
  const year = id[0];
  const subject = id[1];

  let query = supabaseServer
    .schema("public")
    .from("files")
    .select("*")
    .eq("level", year);

  if (subject) {
    query = query.eq("subject", subject);
  }

  const { data: courses, error } = await query;

  if (error) {
    console.error("Fetch courses error:", error);
  }

  return (
    <div className="flex flex-col w-full min-h-screen p-6 bg-background">
      <h1 className="text-3xl font-bold mb-6 text-center text-foreground">
        Courses for {year}
      </h1>
      <FilesClient initialFiles={courses || []} />
    </div>
  );
}
