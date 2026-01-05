import { auth } from "@/auth";
import { getUserRoles } from "@/lib/supabase/actions";
import { notFound } from "next/navigation";

async function EventsPage() {
  const session = await auth();
  if (!session) notFound();
  const { isAdmin, isSuperAdmin } = await getUserRoles(session.user.id);
  if (!isAdmin && !isSuperAdmin) notFound();
  return (
    <div className="flex items-center justify-center h-screen">
      <h1 className="animate-spin text-4xl font-bold hover:animate-none">
        Still working on this 🤨
      </h1>
    </div>
  );
}

export default EventsPage;
