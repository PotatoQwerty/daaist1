import { auth } from "@/auth";
import { RoleGate } from "@/components/RoleGate";
import ManageUsers from "@/app/(auth)/_components/ManageUsers";
import { supabaseServer } from "@/lib/supabase/server";
import { RedirectType, redirect } from "next/navigation";
import { User } from "next-auth";

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
  if (!session || !session.user || session.user.role !== "admin")
    redirect("/", RedirectType.replace);

  const { data: users, error } = await supabaseServer
    .from("users")
    .select(
      "firstname,lastname,registration_number,role,isdaa,username,id,studyyear"
    );

  return (
    <RoleGate AllowedRoles={["admin"]}>
      <ManageUsers initialUsers={users as User[]} />
    </RoleGate>
  );
}
