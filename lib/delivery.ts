import { createAdminClient } from "./supabase/admin";
import { decryptReceiptToken } from "./security";
import { sendReceiptEmail } from "./email";
import { env } from "./env";

type DeliveryRow = { delivery_id: string; claim_token: string; recipient: string; reference: string; expires_at: string; submission_status: string; receipt_token_ciphertext: string | null; full_name: string; evaluator_name: string | null; decision_reason: string | null; decided_at: string | null; jobsite: string };
export async function deliverPendingEmail(submissionId: string, kind: "initial" | "decision_verified" | "decision_rejected" | "decision_revoked" | "resend") {
  const db = createAdminClient(); const { data, error } = await db.rpc("claim_email_delivery", { p_submission_id: submissionId, p_kind: kind, p_lease_seconds: env().EMAIL_DELIVERY_LEASE_SECONDS }).single();
  if (error || !data) return { sent: false, claimed: false };
  const row = data as unknown as DeliveryRow; let token: string | undefined;
  try {
    if (row.receipt_token_ciphertext) token = decryptReceiptToken(row.receipt_token_ciphertext);
    await sendReceiptEmail({ email: row.recipient, reference: row.reference, token, expiresAt: row.expires_at, status: row.submission_status, messageId: `<oec-${row.delivery_id}@${env().GMAIL_USER.split("@")[1]}>`, fullName: row.full_name, evaluatorName: row.evaluator_name ?? undefined, decisionReason: row.decision_reason, decidedAt: row.decided_at, jobsite: row.jobsite });
  } catch {
    const completed = await db.rpc("complete_email_delivery", { p_delivery_id: row.delivery_id, p_claim_token: row.claim_token, p_success: false, p_error_code: "delivery_failed" });
    if (completed.error || completed.data !== true) throw new Error("Email delivery state could not be recorded.");
    return { sent: false, claimed: true };
  }
  const completed = await db.rpc("complete_email_delivery", { p_delivery_id: row.delivery_id, p_claim_token: row.claim_token, p_success: true, p_error_code: null });
  if (completed.error || completed.data !== true) throw new Error("Email delivery state could not be confirmed.");
  return { sent: true, claimed: true };
}
