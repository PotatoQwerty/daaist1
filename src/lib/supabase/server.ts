import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRK = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRK) {
  throw new Error("Missing Vars (server)");
}

export const supabaseServer = createClient(supabaseUrl, supabaseServiceRK, {
  db: { schema: "next_auth" },
});
