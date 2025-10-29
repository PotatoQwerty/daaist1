"use client";
import UploadForm from "@/components/UploadForm";
import { useCurrentRole } from "@/hooks/use-current-role";
import { redirect, RedirectType } from "next/navigation";
import { useSession } from "next-auth/react";

function UploadPage() {
  const { data: session } = useSession();
  const role = useCurrentRole();
  if (role == "student" || !session) redirect("/", RedirectType.replace);

  return <UploadForm userId={session.user.id} />;
}

export default UploadPage;
