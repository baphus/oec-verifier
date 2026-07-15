import { createServerSupabaseClient } from "../supabase/server";
import { logAudit } from "../audit";
import { requireActiveEvaluator } from "../auth";
export async function authenticateEvaluator(input: { email: string; password: string }) {
  const supabase = await createServerSupabaseClient(); const { data, error } = await supabase.auth.signInWithPassword(input);
  if (error || !data.user) throw new Error("Invalid email or password.");
  try { await requireActiveEvaluator(); await logAudit("login", data.user.id, null, { result: "success" }); return { ok: true }; }
  catch (cause) { try { await logAudit("login", data.user.id, null, { result: "authorization_denied" }); } catch { /* sign-out below is mandatory even if audit storage is unavailable */ } await supabase.auth.signOut(); if (cause instanceof Error && cause.message === "Audit logging failed.") throw new Error("Unable to complete sign in safely."); throw new Error("This account is not enabled for evaluator access."); }
}
export async function login(input: { email: string; password: string }) { return authenticateEvaluator(input); }
export async function logout() { const supabase = await createServerSupabaseClient(); const { data: { user } } = await supabase.auth.getUser(); await supabase.auth.signOut(); if (user) await logAudit("logout", user.id, null); return { ok: true }; }
