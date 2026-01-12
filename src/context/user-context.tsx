"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
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

  // Track the current session access token to prevent unnecessary updates
  const currentSessionToken = useRef<string | null>(null);

  useEffect(() => {
    // Get initial session
    const initSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) {
        currentSessionToken.current = data.session.access_token;
      }
      setSession(data.session);
      if (!data.session) setLoading(false);
    };
    initSession();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Only update state if the session actually changed
      const newToken = session?.access_token || null;
      if (newToken !== currentSessionToken.current) {
        currentSessionToken.current = newToken;
        setSession(session);
        if (!session) setLoading(false);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const refreshUser = useCallback(async () => {
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
  }, [session?.user?.id]);

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
  }, [session, refreshUser]);

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
