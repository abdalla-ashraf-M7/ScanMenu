import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "../config";

/** Service-role client — bypasses RLS. SERVER ONLY. Used by /admin flows. */
export function supabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");
  return createClient(SUPABASE_URL, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
