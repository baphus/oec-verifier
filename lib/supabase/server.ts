import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env, supabasePublicKey } from "../env";
export async function createServerSupabaseClient() { const store = await cookies(); const e = env(); return createServerClient(e.NEXT_PUBLIC_SUPABASE_URL, supabasePublicKey(e), { cookies: { getAll: () => store.getAll(), setAll: (values) => { try { values.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* Called from a Server Component — safe to ignore if middleware refreshes sessions */ } } } }); }
