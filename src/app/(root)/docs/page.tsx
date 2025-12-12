import { supabaseServer } from "@/lib/supabase/server";
import FilesClient from "@/components/FilesClient";
import { auth } from "@/auth";
import Link from "next/link";
export const revalidate = 3600; // Cache for 1 hour (ISR)
export const metadata = {
  title: "Daa'ist — Documents",
  description: "Explore resources, and materials for all academic years.",
  alternates: {
    canonical: "https://daaist.com/docs",
  },
};
export default async function DocsPage() {
  const session = await auth();
  if (!session) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-card border border-accent/30 rounded-2xl p-8 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Access restricted
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            You need to be signed in to view courses and resources.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/api/auth/signin"
              className="inline-flex items-center px-4 py-2 bg-accent text-background rounded-md shadow-sm hover:brightness-95 transition"
            >
              Sign in
            </Link>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-accent/20 rounded-md text-foreground hover:bg-accent/5 transition"
            >
              Go home
            </Link>
          </div>
        </div>
      </div>
    );
  }
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
