"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { getUserData } from "@/lib/supabase/actions";

interface UserContextType {
  user: any | null; // Replace 'any' with your Profile type if available
  roles: string[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  refreshUser: () => Promise<void>;
  session: any | null;
}

const UserContext = createContext<UserContextType>({
  user: null,
  roles: [],
  isAdmin: false,
  isSuperAdmin: false,
  loading: true,
  refreshUser: async () => {},
  session: null,
});

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    const initSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      if (!data.session) setLoading(false);
    };
    initSession();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (!session) setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const refreshUser = async () => {
    if (!session?.user?.id) {
      setUser(null);
      setRoles([]);
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setLoading(false);
      return;
    }

    try {
      const data = await getUserData(session.user.id);
      setUser(data.user);
      setRoles(data.roles);
      setIsAdmin(data.isAdmin);
      setIsSuperAdmin(data.isSuperAdmin);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!session) {
      setUser(null);
      setRoles([]);
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setLoading(false);
      return;
    }
    setLoading(true); // Start loading user data
    refreshUser();
  }, [session]);

  return (
    <UserContext.Provider
      value={{
        user,
        roles,
        isAdmin,
        loading,
        refreshUser,
        isSuperAdmin,
        session,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
