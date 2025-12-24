import UploadForm from "@/components/UploadForm";
import { redirect, RedirectType } from "next/navigation";
import { auth } from "@/auth";
import { getUserRoles } from "@/lib/supabase/actions";
async function UploadPage() {
  const session = await auth();
  if (!session) redirect("/", RedirectType.replace);
  const { isAdmin } = await getUserRoles(session?.user.id!);
  if (!isAdmin || !session) redirect("/", RedirectType.replace);

  return <UploadForm />;
}

export default UploadPage;
