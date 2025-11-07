"use client";
import { RoleGate } from "@/components/RoleGate";
import { useCurrentRole } from "@/hooks/use-current-role";
import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";

function AdminPage() {
  const { data: session, status } = useSession();
  const role = useCurrentRole();
  if (status === "loading") {
    return null;
  }
  if (role !== "admin" || !role || !session) {
    return redirect("/");
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold">Hello to the admin Page</h1>
      <p>This Page is still under construction</p>
      <RoleGate AllowedRoles={["club"]}>
        <p>hola club</p>
      </RoleGate>
    </div>
  );
}

export default AdminPage;
