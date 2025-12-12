import UploadForm from "@/components/UploadForm";
import { redirect, RedirectType } from "next/navigation";
import { auth } from "@/auth";
async function UploadPage() {
  const session = await auth();
  const role = session?.user.role;
  if (role !== "admin" || !session) redirect("/", RedirectType.replace);

  return <UploadForm />;
}

export default UploadPage;
