import "server-only";

import { createClient } from "@/lib/supabase/auth/server";
import { getUserData } from "@/lib/supabase/actions";

export type UserContextData = {
  session: any | null;
  user: any | null;
  roles: string[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
};

export async function getUserContext(): Promise<UserContextData> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.id) {
    return {
      session: null,
      user: null,
      roles: [],
      isAdmin: false,
      isSuperAdmin: false,
    };
  }

  const userData = await getUserData(user.id);
  const safeSession = { user };

  return {
    session: safeSession,
    user: userData.user,
    roles: userData.roles,
    isAdmin: userData.isAdmin,
    isSuperAdmin: userData.isSuperAdmin,
  };
}
