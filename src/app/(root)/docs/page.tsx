import { supabaseServer } from "@/lib/supabase/server";
import FilesClient from "@/components/FilesClient";

export const revalidate = 3600; // Cache for 1 hour (ISR)

export default async function DocsPage() {
  const { data: files, error } = await supabaseServer
    .schema("public")
    .from("files")
    .select("*")
    .eq("category", "doc");

  if (error) {
    console.error("Error fetching docs:", error);
  }

  return (
    <div className="flex flex-col w-full min-h-screen p-6 bg-background">
      <h1 className="text-3xl font-bold mb-6 text-center text-foreground">
        Documents
      </h1>
      <FilesClient initialFiles={files || []} />
    </div>
  );
}
