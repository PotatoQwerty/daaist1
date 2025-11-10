"use client";
import UploadForm from "@/components/UploadForm";
import { useCurrentRole } from "@/hooks/use-current-role";
import { redirect, RedirectType } from "next/navigation";

function UploadPage() {
  const role = useCurrentRole();
  if (role == "student") redirect("/", RedirectType.replace);

  return <UploadForm />;
}

export default UploadPage;
