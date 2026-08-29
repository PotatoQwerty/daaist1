import { RoleGate } from "@/components/RoleGate";
import ManageUsers from "@/app/(auth)/_components/ManageUsers";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { fetchUsers, getUserRoles } from "@/lib/supabase/actions";

export const revalidate = 1800;

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

  const userRole = await getUserRoles(user.id);

  if (!userRole) return notFound();

  const users = await fetchUsers();

  return (
    <div className="flex flex-col w-full">
      <RoleGate AllowedRoles={["admin", "super_admin"]}>
        <ManageUsers initialUsers={users} currentUserId={user.id} />
      </RoleGate>
    </div>
  );
}
