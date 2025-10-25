import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceRK = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const subabaseSecret = process.env.NEXT_PUBLIC_SUPABASE_KEY as string;

if (!supabaseUrl || !supabaseServiceRK) {
  throw new Error("Missing Vars");
}
export const supabaseCli = createClient(supabaseUrl, supabaseServiceRK, {
  db: { schema: "next_auth" },
});

export const publicSupabaseCli = createClient(supabaseUrl, subabaseSecret);
