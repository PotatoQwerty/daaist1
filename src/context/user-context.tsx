"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import { getUserData } from "@/lib/supabase/actions";

interface UserContextType {
  user: any | null; // Replace 'any' with your Profile type if available
  roles: string[];
  isAdmin: boolean;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  roles: [],
  isAdmin: false,
  loading: true,
  refreshUser: async () => {},
});

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<any | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    if (!session?.user?.id) {
      setUser(null);
      setRoles([]);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      const data = await getUserData(session.user.id);
      setUser(data.user);
      setRoles(data.roles);
      setIsAdmin(data.isAdmin);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "loading") return;
    refreshUser();
  }, [session, status]);

  return (
    <UserContext.Provider
      value={{ user, roles, isAdmin, loading, refreshUser }}
    >
      {children}
    </UserContext.Provider>
  );
};
