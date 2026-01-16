import { getUserRoles } from "@/lib/supabase/actions";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function EventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();
  const { isAdmin, isSuperAdmin } = await getUserRoles(user.id);
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
