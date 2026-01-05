import { useUser } from "@/context/user-context";

export const useCurrentRole = () => {
  const { roles, isAdmin, loading, isSuperAdmin } = useUser();
  return { roles, isAdmin, loading, isSuperAdmin };
};
