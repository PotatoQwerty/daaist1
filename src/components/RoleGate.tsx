"use client";

import { useCurrentRole } from "@/hooks/use-current-role";
import Loading from "@/components/Loading";

interface RoleGateProps {
  children: React.ReactNode;
  AllowedRoles: string[];
}

export const RoleGate = ({ children, AllowedRoles }: RoleGateProps) => {
  const { roles, loading } = useCurrentRole();

  if (loading) return <Loading />;

  // Check if user has any of the allowed roles
  const isAllowed = roles.some((role) => AllowedRoles.includes(role));

  // if (!isAllowed) {
  //   return (
  //     <div className="flex flex-col items-center justify-center w-full min-h-[50vh] gap-4">
  //       <h1 className="text-red-500 font-bold text-2xl">Access Denied 🚫</h1>
  //       <p className="text-muted-foreground">
  //         You do not have permission to view this content.
  //       </p>
  //     </div>
  //   );
  // }
  if (!isAllowed) {
    return null;
  }

  return <>{children}</>;
};
