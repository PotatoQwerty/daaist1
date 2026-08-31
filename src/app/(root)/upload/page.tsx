import type { Metadata } from "next";
import UploadForm from "@/components/UploadForm";
import { NOINDEX } from "@/lib/site";

/** Requires the upload capability; nothing for a crawler to see. */
export const metadata: Metadata = {
  title: "Upload",
  robots: NOINDEX,
};
import { notFound, redirect, RedirectType } from "next/navigation";
import { getUserRoles } from "@/lib/supabase/actions";
import { createClient } from "@/lib/supabase/server";

async function UploadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/", RedirectType.replace);
  const { canUpload } = await getUserRoles(user.id);
  if (!canUpload) notFound();

  return <UploadForm />;
}

export default UploadPage;
