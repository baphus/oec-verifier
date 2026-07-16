"use server";
import { revalidatePath } from "next/cache";
import { requireActiveEvaluator } from "../auth";
import { createAdminClient } from "../supabase/admin";
import { decisionSchema, idSchema, searchSchema } from "../types";
import { logAudit } from "../audit";
import { deliverPendingEmail } from "../delivery";
export async function getDashboard(input: unknown = {}) { await requireActiveEvaluator(); const q = searchSchema.parse(input); let query = createAdminClient().from("submissions").select("id,reference,full_name,email,oec_number,gender,category,position,jobsite,province,region,contact_number,employer,issued_at,expires_at,expired_at,status,decision_reason,decided_at,created_at", { count: "exact" }).order("created_at", { ascending: false }).range(q.page * 25, q.page * 25 + 24); if (q.status) query = query.eq("status", q.status); if (q.query) query = query.or(`reference.ilike.%${q.query}%,email.ilike.%${q.query}%,oec_number.ilike.%${q.query}%`); const { data, count, error } = await query; if (error) throw new Error("Unable to load submissions."); return { submissions: data ?? [], total: count ?? 0 }; }
export async function getAllSubmissions() { await requireActiveEvaluator(); const { data, error } = await createAdminClient().from("submissions").select("id,reference,full_name,email,oec_number,gender,category,employer,position,jobsite,province,region,contact_number,departure_date,issued_at,expires_at,expired_at,status,decision_reason,decided_at,decided_by,created_at").order("created_at", { ascending: false }).range(0, 9999); if (error) throw new Error("Unable to load submissions."); return data ?? []; }
export async function getDecisionAuthors(ids: string[]) { await requireActiveEvaluator(); const unique = Array.from(new Set(ids.filter(Boolean))); if (!unique.length) return {} as Record<string, string>; const { data, error } = await createAdminClient().from("profiles").select("id,display_name").in("id", unique); if (error) throw new Error("Unable to load evaluator names."); const map: Record<string, string> = {}; for (const p of data ?? []) map[p.id] = p.display_name ?? p.id; return map; }
export async function getPendingCount() { await requireActiveEvaluator(); const { count, error } = await createAdminClient().from("submissions").select("id", { count: "exact", head: true }).eq("status", "pending"); if (error) throw new Error("Unable to load pending count."); return count ?? 0; }
export async function getPendingQueue() { await requireActiveEvaluator(); const { data, error } = await createAdminClient().from("submissions").select("id,reference,full_name,email,oec_number,category,position,jobsite,province,region,contact_number,status,created_at").eq("status", "pending").order("created_at", { ascending: true }).range(0, 99); if (error) throw new Error("Unable to load pending submissions."); return data ?? []; }
export async function getSubmission(id: string) { idSchema.parse(id); await requireActiveEvaluator(); const { data, error } = await createAdminClient().from("submissions").select("id,reference,first_name,middle_name,last_name,suffix,full_name,email,oec_number,gender,category,philippine_address,province,region,employer,position,jobsite,contact_number,departure_date,details,issued_at,expires_at,expired_at,status,decision_reason,decided_at,decided_by,created_at").eq("id", id).single(); if (error || !data) throw new Error("Submission not found."); return data; }
async function decide(id: string, status: "verified" | "rejected", reason?: string) { const { user } = await requireActiveEvaluator(); const parsed = decisionSchema.parse({ id, reason }); const { data, error } = await createAdminClient().rpc("transition_submission", { p_submission_id: parsed.id, p_status: status, p_actor: user.id, p_reason: parsed.reason ?? null }); if (error || !data) throw new Error("Submission was already decided or is unavailable."); try { const delivery = await deliverPendingEmail(id, status === "verified" ? "decision_verified" : "decision_rejected"); return { ok: true, emailWarning: !delivery.sent, emailSent: delivery.sent }; } catch { return { ok: true, emailWarning: true, emailSent: false }; } }
export async function verifySubmission(id: string) { return decide(id, "verified"); }
export async function rejectSubmission(id: string, reason: string) { return decide(id, "rejected", reason); }
export async function getEvaluatorProfile() { const { user } = await requireActiveEvaluator(); const { data, error } = await createAdminClient().from("profiles").select("id,display_name,role,active,created_at").eq("id", user.id).single(); if (error) throw new Error("Unable to load profile."); return { ...data, email: user.email ?? "" }; }
export async function updateEvaluatorProfile(input: { display_name?: string }) { const { user } = await requireActiveEvaluator(); const supabase = createAdminClient(); if (input.display_name !== undefined) { const { error } = await supabase.from("profiles").update({ display_name: input.display_name || null }).eq("id", user.id); if (error) throw new Error("Unable to update profile."); } revalidatePath("/evaluator/responses"); revalidatePath("/evaluator"); revalidatePath("/evaluator/export"); return { ok: true }; }
export async function revokeSubmission(id: string, reason?: string) { const { user } = await requireActiveEvaluator(); const parsed = decisionSchema.parse({ id, reason }); const { data, error } = await createAdminClient().rpc("transition_submission", { p_submission_id: parsed.id, p_status: "revoked", p_actor: user.id, p_reason: parsed.reason ?? null }); if (error || !data) throw new Error("Only a verified submission can be revoked."); try { const delivery = await deliverPendingEmail(id, "decision_revoked"); return { ok: true, emailWarning: !delivery.sent, emailSent: delivery.sent }; } catch { return { ok: true, emailWarning: true, emailSent: false }; } }
export async function resendReceiptEmail(id: string) { idSchema.parse(id); const { user } = await requireActiveEvaluator(); const { data, error } = await createAdminClient().rpc("request_email_resend", { p_submission_id: id }); if (error || !data) throw new Error("Only an active verified receipt can be resent."); try { await logAudit("email_resent", user.id, id, { result: "requested" }); } catch { return { ok: true, emailWarning: true, emailSent: false }; } try { const delivery = await deliverPendingEmail(id, "resend"); return { ok: true, emailWarning: !delivery.sent, emailSent: delivery.sent }; } catch { return { ok: true, emailWarning: true, emailSent: false }; } }

export type EmailDeliveryStatus = {
  id: string;
  kind: string;
  status: string;
  attempts: number;
  last_error_code: string | null;
  sent_at: string | null;
  created_at: string;
};
export async function getEmailDeliveries(submissionId: string): Promise<EmailDeliveryStatus[]> {
  idSchema.parse(submissionId);
  await requireActiveEvaluator();
  const { data, error } = await createAdminClient()
    .from("email_deliveries")
    .select("id,kind,status,attempts,last_error_code,sent_at,created_at")
    .eq("submission_id", submissionId)
    .order("created_at", { ascending: false });
  if (error) throw new Error("Unable to load email delivery status.");
  return data ?? [];
}
export async function getEmailDeliveriesBatch(ids: string[]): Promise<Record<string, EmailDeliveryStatus[]>> {
  await requireActiveEvaluator();
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (!unique.length) return {};
  const { data, error } = await createAdminClient()
    .from("email_deliveries")
    .select("submission_id,id,kind,status,attempts,last_error_code,sent_at,created_at")
    .in("submission_id", unique)
    .order("created_at", { ascending: false });
  if (error) throw new Error("Unable to load email delivery status.");
  const map: Record<string, EmailDeliveryStatus[]> = {};
  for (const row of data ?? []) {
    if (!map[row.submission_id]) map[row.submission_id] = [];
    map[row.submission_id].push(row);
  }
  return map;
}
