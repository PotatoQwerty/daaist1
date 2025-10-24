"use client";

import { useCurrentRole } from "@/hooks/use-current-role";
import Loading from "@/components/Loading";
interface RoleGateProps {
  children: React.ReactNode;
  AllowedRoles: string[];
}

export const RoleGate = ({ children, AllowedRoles }: RoleGateProps) => {
  const role = useCurrentRole();

  if (!role) return <Loading />;

  if (!AllowedRoles.includes(role)) {
    return (
      <h1 className="text-red-500 font-semibold text-center">
        Access denied 🚫
      </h1>
    );
  } else {
    return <>{children}</>;
  }
};
