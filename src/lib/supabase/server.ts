import { createServerClient } from "@supabase/ssr";
import { createClient as createJsClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { SUPABASE_COOKIE_OPTIONS } from "./cookie-options";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRK = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!;

if (!supabaseUrl || !supabaseServiceRK || !supabaseAnonKey) {
  throw new Error("Missing Vars (server)");
}

/**
 * Full-privilege client. Bypasses row level security, so every caller is
 * responsible for its own access control. Use it deliberately, and always
 * scope the query to the acting user.
 */
export const supabaseServer = createJsClient(supabaseUrl, supabaseServiceRK);

/**
 * Cookie-backed client for reading the caller's session.
 *
 * This is keyed with the ANON key on purpose. It was previously built with
 * the service role key, which meant every query made through it silently ran
 * with full privileges and no row level security, and an anonymous request
 * fell back to the service role JWT outright. Reach for `supabaseServer`
 * when a route genuinely needs elevated access.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: SUPABASE_COOKIE_OPTIONS,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}
