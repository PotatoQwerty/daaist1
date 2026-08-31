import { RoleGate } from "@/components/RoleGate";
import ManageUsers from "@/app/(auth)/_components/ManageUsers";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { fetchUsers, getUserRoles } from "@/lib/supabase/actions";

/* No revalidate: these pages read cookies through createClient(), which
   makes them dynamic regardless, so the directive was inert and misleading
   about how the page is served. */

export const metadata = {
  title: "Daa'ist - Manage Users",
  description: "Manage Daa'ist users.",
  alternates: {
    canonical: "https://daaist.com/admin/manage/users",
  },
};

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return notFound();

  /* This checked `if (!userRole)`, but getUserRoles always resolves to an
     object, so the condition was never true and the page relied entirely on
     the layout's gate. The real check, stated here as well. */
  const { isAdmin, isSuperAdmin } = await getUserRoles(user.id);
  if (!isAdmin && !isSuperAdmin) return notFound();

  const users = await fetchUsers();

  return (
    <div className="flex flex-col w-full">
      <RoleGate AllowedRoles={["admin", "super_admin"]}>
        <ManageUsers initialUsers={users} currentUserId={user.id} />
      </RoleGate>
    </div>
  );
}
