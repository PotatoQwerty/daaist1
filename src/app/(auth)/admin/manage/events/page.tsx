"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { RedirectType, redirect } from "next/navigation";
import { RoleGate } from "@/components/RoleGate";
function EventPage() {
  const { data: session, status } = useSession();
  useEffect(() => {
    if (!session && status === "loading")
      return redirect("/", RedirectType.replace);
  }, [session, status]);
  return (
    <RoleGate AllowedRoles={["admin"]}>
      <div>Event page</div>
    </RoleGate>
  );
}

export default EventPage;
