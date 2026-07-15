import { createBrowserClient } from "@supabase/ssr";
import { env, supabasePublicKey } from "../env";
export function createPublicClient() { const e = env(); return createBrowserClient(e.NEXT_PUBLIC_SUPABASE_URL, supabasePublicKey(e)); }
