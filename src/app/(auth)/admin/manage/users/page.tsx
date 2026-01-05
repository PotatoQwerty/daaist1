import { auth } from "@/auth";
import { RoleGate } from "@/components/RoleGate";
import ManageUsers from "@/app/(auth)/_components/ManageUsers";
import { supabaseServer } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { fetchUsers, getUserRoles } from "@/lib/supabase/actions";
export const revalidate = 1800;

export const metadata = {
  title: "Daa'ist | Users",
  robots: {
    index: false,
    follow: false,
  },
};
export default async function AdminUsersPage() {
  const session = await auth();
  if (!session) notFound();
  const { isAdmin, isSuperAdmin } = await getUserRoles(session.user.id);

  if (!isAdmin && !isSuperAdmin) notFound();

  const users = await fetchUsers();

  return (
    <RoleGate AllowedRoles={["admin", "super_admin"]}>
      <ManageUsers initialUsers={users as any[]} />
    </RoleGate>
  );
}
