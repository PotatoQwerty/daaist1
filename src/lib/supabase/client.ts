import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_COOKIE_OPTIONS } from "./cookie-options";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Vars (client)");
}

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: SUPABASE_COOKIE_OPTIONS,
  });
}
