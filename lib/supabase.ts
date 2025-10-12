import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.supabaseUrl as string;
const supabaseServiceRK = process.env.supabaseServiceRoleKey as string;

if (!supabaseUrl || !supabaseServiceRK) {
  throw new Error("Missing Vars");
}
export const supabaseCli = createClient(supabaseUrl, supabaseServiceRK, {
  db: { schema: "next_auth" },
});
