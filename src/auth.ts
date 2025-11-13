import { SupabaseAdapter } from "@auth/supabase-adapter";
import NextAuth from "next-auth";
import authConfig from "../auth.config";
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  }),
  ...authConfig,
});
