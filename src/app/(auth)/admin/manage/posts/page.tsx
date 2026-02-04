import { RoleGate } from "@/components/RoleGate";
import ManageFiles from "@/app/(auth)/_components/ManageFiles";
import { createClient, supabaseServer } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { File } from "@/types/next-auth";
import { getUserRoles } from "@/lib/supabase/actions";

export const revalidate = 1800;

export const metadata = {
  title: "Daa'ist - Manage Posts",
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
  if (!userRole?.isAdmin && !userRole?.isSuperAdmin) return notFound();

  const { data: posts, error } = await supabaseServer
    .schema("public")
    .from("files")
    .select(
      `
      id,
      url,
      created_at,
      file_name,
      type,
      category,
      level,
      subject,
      issum,
      size,
      profiles (
        username
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch files:", error);
    return notFound();
  }

  const normalizedFiles = (posts ?? []).map((file: any) => ({
    ...file,
    username: file?.profiles?.username ?? undefined,
  }));

  return (
    <div className="flex flex-col w-full">
      <RoleGate AllowedRoles={["admin", "super_admin"]}>
        <ManageFiles initialFiles={(normalizedFiles as File[]) ?? []} />
      </RoleGate>
    </div>
  );
}

