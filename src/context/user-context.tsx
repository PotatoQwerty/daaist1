"use client";

import type { Dispatch, SetStateAction, ReactNode } from "react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";

interface UserContextType {
  user: any | null; // Replace 'any' with your Profile type if available
  roles: string[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  session: any | null;
  setUser: Dispatch<SetStateAction<any | null>>;
  setSession: Dispatch<SetStateAction<any | null>>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  roles: [],
  isAdmin: false,
  isSuperAdmin: false,
  loading: false,
  session: null,
  setUser: () => {},
  setSession: () => {},
});

export const useUser = () => useContext(UserContext);

export const UserProvider = ({
  children,
  initialSession = null,
  initialUser = null,
  initialRoles = [],
  initialIsAdmin = false,
  initialIsSuperAdmin = false,
}: {
  children: ReactNode;
  initialSession?: any | null;
  initialUser?: any | null;
  initialRoles?: string[];
  initialIsAdmin?: boolean;
  initialIsSuperAdmin?: boolean;
}) => {
  const [session, setSession] = useState<any | null>(initialSession);
  const [user, setUser] = useState<any | null>(initialUser);
  const [roles, setRoles] = useState<string[]>(initialRoles);
  const [isAdmin, setIsAdmin] = useState<boolean>(initialIsAdmin);
  const [isSuperAdmin, setIsSuperAdmin] =
    useState<boolean>(initialIsSuperAdmin);
  const [loading, setLoading] = useState(!initialSession?.user?.id);
  const supabase = useMemo(() => createClient(), []);
  const sessionRef = useRef<any | null>(initialSession);

  useEffect(() => {
    setSession(initialSession ?? null);
    setUser(initialUser ?? null);
    setRoles(initialRoles ?? []);
    setIsAdmin(Boolean(initialIsAdmin));
    setIsSuperAdmin(Boolean(initialIsSuperAdmin));
    setLoading(!initialSession?.user?.id);
  }, [
    initialSession,
    initialUser,
    initialRoles,
    initialIsAdmin,
    initialIsSuperAdmin,
  ]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    let isMounted = true;
    const shouldSyncImmediately = !initialSession?.user?.id;

    const syncUserContext = async (options?: { silent?: boolean }) => {
      if (!isMounted) return;
      if (!options?.silent) {
        setLoading(true);
      }

      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (!isMounted) return;

      if (authError || !authUser) {
        setSession(null);
        setUser(null);
        setRoles([]);
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/user-context", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (!isMounted) return;
          setSession(data.session ?? { user: authUser });
          setUser(data.user ?? null);
          setRoles(data.roles ?? []);
          setIsAdmin(Boolean(data.isAdmin));
          setIsSuperAdmin(Boolean(data.isSuperAdmin));
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error("Failed to sync user context:", error);
      }

      if (!isMounted) return;
      setSession({ user: authUser });
      setUser(null);
      setRoles([]);
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setLoading(false);
    };

    if (shouldSyncImmediately) {
      syncUserContext();
    }

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setSession(null);
        setUser(null);
        setRoles([]);
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setLoading(false);
        return;
      }

      const hasSession = Boolean(sessionRef.current?.user?.id);
      if (event === "INITIAL_SESSION" && hasSession) {
        return;
      }
      syncUserContext({ silent: hasSession });
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, [initialSession?.user?.id, supabase]);

  return (
    <UserContext.Provider
      value={{
        user,
        roles,
        isAdmin,
        loading,
        isSuperAdmin,
        session,
        setUser,
        setSession,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
