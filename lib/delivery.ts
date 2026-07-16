import { createAdminClient } from "./supabase/admin";
import { decryptReceiptToken } from "./security";
import { sendReceiptEmail } from "./email";
import { env } from "./env";

type DeliveryRow = {
  delivery_id: string; claim_token: string; recipient: string; reference: string;
  expires_at: string; submission_status: string; receipt_token_ciphertext: string | null;
  full_name: string; evaluator_name: string | null; decision_reason: string | null;
  decided_at: string | null; jobsite: string;
  oec_number: string; issued_at: string;
  first_name: string; middle_name: string; last_name: string; suffix: string;
  position: string; gender: string; category: string;
  philippine_address: string; province: string; region: string;
  contact_number: string; departure_date: string | null; details: string;
  created_at: string; consented_at: string;
};
export async function deliverPendingEmail(submissionId: string, kind: "initial" | "decision_verified" | "decision_rejected" | "decision_revoked" | "resend") {
  const db = createAdminClient(); const { data, error } = await db.rpc("claim_email_delivery", { p_submission_id: submissionId, p_kind: kind, p_lease_seconds: env().EMAIL_DELIVERY_LEASE_SECONDS }).single();
  if (error || !data) return { sent: false, claimed: false };
  const row = data as unknown as DeliveryRow; let token: string | undefined;
  try {
    if (row.receipt_token_ciphertext) token = decryptReceiptToken(row.receipt_token_ciphertext);
    await sendReceiptEmail({
      email: row.recipient, reference: row.reference, token, expiresAt: row.expires_at,
      status: row.submission_status,
      messageId: `<oec-${row.delivery_id}@${env().GMAIL_USER.split("@")[1]}>`,
      fullName: row.full_name, evaluatorName: row.evaluator_name ?? undefined,
      decisionReason: row.decision_reason, decidedAt: row.decided_at, jobsite: row.jobsite,
      // rich receipt fields
      oecNumber: row.oec_number, issuedAt: row.issued_at,
      firstName: row.first_name, middleName: row.middle_name, lastName: row.last_name, suffix: row.suffix,
      position: row.position,
      gender: row.gender, category: row.category,
      philippineAddress: row.philippine_address, province: row.province, region: row.region,
      contactNumber: row.contact_number, departureDate: row.departure_date ?? undefined, details: row.details,
      submittedAt: row.created_at,
    });
  } catch {
    const completed = await db.rpc("complete_email_delivery", { p_delivery_id: row.delivery_id, p_claim_token: row.claim_token, p_success: false, p_error_code: "delivery_failed" });
    if (completed.error || completed.data !== true) throw new Error("Email delivery state could not be recorded.");
    return { sent: false, claimed: true };
  }
  const completed = await db.rpc("complete_email_delivery", { p_delivery_id: row.delivery_id, p_claim_token: row.claim_token, p_success: true, p_error_code: null });
  if (completed.error || completed.data !== true) throw new Error("Email delivery state could not be confirmed.");
  return { sent: true, claimed: true };
}
