import UploadForm from "@/components/UploadForm";
import { notFound, redirect, RedirectType } from "next/navigation";
import { getUserRoles } from "@/lib/supabase/actions";
import { createClient } from "@/lib/supabase/server";

async function UploadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/", RedirectType.replace);
  const { isAdmin, isSuperAdmin } = await getUserRoles(user.id);
  if (!isAdmin && !isSuperAdmin) notFound();

  return <UploadForm />;
}

export default UploadPage;
