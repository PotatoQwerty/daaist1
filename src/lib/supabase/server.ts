import { createServerClient } from "@supabase/ssr";
import { createClient as createJsClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRK = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRK) {
  throw new Error("Missing Vars (server)");
}

// Export specific admin client as requested by user
export const supabaseServer = createJsClient(supabaseUrl, supabaseServiceRK);

// Export async SSR client for Auth/Session handling
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseServiceRK, {
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
