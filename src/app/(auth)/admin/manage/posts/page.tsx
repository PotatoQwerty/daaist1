import { RoleGate } from "@/components/RoleGate";
import ManageFiles from "@/app/(auth)/_components/ManageFiles";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { File } from "@/types/next-auth";
import { getUserRoles } from "@/lib/supabase/actions";
export const revalidate = 1800;
export const metadata = {
  title: "Daa'ist — Manage Posts",
  description: "Manage Daa'ist posts.",
  alternates: {
    canonical: "https://daaist.com/admin/manage/posts",
  },
};
export default async function ManagePosts() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return notFound();

  const userRole = await getUserRoles(user.id);

  const { data: posts, error } = await supabase.from("files").select("*");

  if (!userRole) return notFound();

  return (
    <div className="flex flex-col w-full">
      <RoleGate AllowedRoles={["admin", "super_admin"]}>
        <ManageFiles initialFiles={(posts as File[]) ?? []} />
      </RoleGate>
    </div>
  );
}
