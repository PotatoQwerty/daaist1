import { auth } from "@/auth";
import { RoleGate } from "@/components/RoleGate";
import ManageUsers from "@/app/(auth)/_components/ManageUsers";
import { supabaseServer } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { getUserRoles } from "@/lib/supabase/actions";
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
  const { isAdmin } = await getUserRoles(session.user.id);

  if (!isAdmin) notFound();

  const { data: users, error } = await supabaseServer
    .schema("public")
    .from("profiles").select(`
  user_id,
  firstname,
  lastname,
  username,
  user_roles ( role ),
  student_enrollments ( study_year, isdaa ),
  registration_number
`);

  return (
    <RoleGate AllowedRoles={["admin", "super_admin"]}>
      <ManageUsers initialUsers={users as any[]} />
    </RoleGate>
  );
}
