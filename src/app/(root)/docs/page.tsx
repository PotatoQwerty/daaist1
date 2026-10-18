import { createClient, supabaseServer } from "@/lib/supabase/server";
import FilesClient from "@/components/FilesClient";
import AccessGate from "@/components/AccessGate";
import { NOINDEX } from "@/lib/site";
import PageHeader from "@/components/PageHeader";

export const revalidate = 3600; // Cache for 1 hour (ISR)

export const metadata = {
  // Gated behind a student account: a crawler only ever sees the sign-in
  // prompt, so there is nothing here worth indexing.
  robots: NOINDEX,
  title: "Documents",
  description:
    "Admin paperwork, forms and reference material for students at the Département d'Architecture d'Alger.",
};

export default async function Documents() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return <AccessGate what="the document archive" redirectTo="/docs" />;
  }

  const { data: files, error: fetchDocError } = await supabaseServer
    .schema("public")
    .from("files")
    .select("*")
    .eq("category", "doc");

  if (fetchDocError) {
    console.error("Error fetching docs:", fetchDocError);
  }

  const count = files?.length ?? 0;

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-12 sm:px-6 md:py-16">
      <PageHeader
        title="Documents"
        lede="Admin paperwork, forms and reference material, shared by students and staff."
        domain="docs"
        meta={`${count} ${count === 1 ? "file" : "files"}`}
      />

      <div className="mt-10">
        <FilesClient initialFiles={files || []} />
      </div>
    </main>
  );
}
