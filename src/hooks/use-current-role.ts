import { useUser } from "@/context/user-context";

export const useCurrentRole = () => {
  const { roles, isAdmin, loading } = useUser();
  return { roles, isAdmin, loading };
};
