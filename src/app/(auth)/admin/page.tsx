import { notFound } from "next/navigation";
import MainAdmin from "../_components/MainAdmin";
import { getUserRoles } from "@/lib/supabase/actions";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) notFound();
  const { isAdmin, isSuperAdmin } = await getUserRoles(session.user.id);
  if (!isAdmin && !isSuperAdmin) notFound();

  return (
    <div className="min-h-screen w-full bg-background p-6 md:p-12">
      <div className="w-full max-w-5xl mx-auto space-y-8">
        <header className="flex flex-col space-y-2 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            Admin Dashboard
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage roles, invites, and system settings.
          </p>
        </header>

        <main>
          <MainAdmin />
        </main>
      </div>
    </div>
  );
}
