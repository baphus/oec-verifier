import { createClient } from "@supabase/supabase-js";
import { env } from "../env";
export function createAdminClient() { const e = env(); return createClient(e.NEXT_PUBLIC_SUPABASE_URL, e.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } }); }
