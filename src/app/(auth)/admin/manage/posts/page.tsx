import { RoleGate } from "@/components/RoleGate";
import ManageFiles from "@/app/(auth)/_components/ManageFiles";
import { supabaseServer } from "@/lib/supabase/server";
import { auth } from "@/auth";
import { redirect, RedirectType } from "next/navigation";
import { File } from "@/types/next-auth";
export const metadata = {
  title: "DAA'ist | Manage Posts",
  robots: {
    index: false,
    follow: false,
  },
};
export default async function ManagePosts() {
  const session = await auth();
  if (!session || !session.user || session.user.role !== "admin")
    redirect("/", RedirectType.replace);
  const { data: files, error } = await supabaseServer
    .schema("public")
    .from("files_with_users")
    .select("*");
  if (error) {
    console.error("Fetch courses error:", error);
  }

  return (
    <RoleGate AllowedRoles={["admin"]}>
      <ManageFiles initialFiles={files as File[]} />
    </RoleGate>
  );
}
