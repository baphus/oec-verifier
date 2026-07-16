import { createAdminClient } from "../supabase/admin";
import { publicApplicationSchema, type PublicApplicationInput, type PublicReceipt } from "../types";
import { createReceiptToken, decryptReceiptToken, encryptReceiptToken, hashReceiptToken, maskOec, receiptState } from "../security";
import { env } from "../env";

// Internal domain functions. Publicly callable FormData validation lives in submissions.ts.
export async function createSubmission(input: PublicApplicationInput, ipKeyHash: string, emailKeyHash: string) {
  const value = publicApplicationSchema.parse(input); const token = createReceiptToken(); const e = env(); const issuedAt = new Date(); const expiresAt = new Date(issuedAt.getTime() + e.RECEIPT_VALIDITY_HOURS * 3600000); const fullName = [value.firstName, value.middleName, value.lastName, value.suffix].filter(Boolean).join(" ");
  const { data, error } = await createAdminClient().rpc("create_public_submission", { p_request_id: value.requestId, p_first_name: value.firstName, p_middle_name: value.middleName, p_last_name: value.lastName, p_suffix: value.suffix, p_full_name: fullName, p_email: value.email, p_oec_number: value.oecNumber, p_gender: value.gender, p_category: value.category, p_philippine_address: value.philippineAddress, p_province: value.province, p_region: value.region, p_position: value.position, p_jobsite: value.jobsite, p_contact_number: value.contactNumber, p_departure_date: new Date().toISOString().slice(0, 10), p_details: "", p_issued_at: issuedAt.toISOString(), p_expires_at: expiresAt.toISOString(), p_receipt_token_hash: hashReceiptToken(token), p_receipt_token_ciphertext: encryptReceiptToken(token), p_ip_key_hash: ipKeyHash, p_email_key_hash: emailKeyHash, p_max_attempts: e.RATE_LIMIT_MAX_ATTEMPTS, p_window_minutes: e.RATE_LIMIT_WINDOW_MINUTES }).single();
  if (error || !data) throw new Error(error?.message === "rate_limited" ? "Too many submissions. Please try again later." : "We could not submit your application. Please try again.");
  const row = data as unknown as { submission_id: string | null; reference: string | null; expires_at: string | null; receipt_token_ciphertext: string | null; was_existing: boolean };
  if (!row.submission_id || !row.reference || !row.expires_at || !row.receipt_token_ciphertext) throw new Error("Too many submissions. Please try again later.");
  const persistedToken = decryptReceiptToken(row.receipt_token_ciphertext); return { id: row.submission_id, reference: row.reference, token: persistedToken, expiresAt: row.expires_at };
}
export async function retrieveReceipt(token: unknown): Promise<PublicReceipt> {
  if (typeof token !== "string" || token.length < 40 || token.length > 100) throw new Error("Receipt not found or expired.");
  const { data, error } = await createAdminClient().from("submissions").select(
    "reference,oec_number,status,issued_at,expires_at,full_name,first_name,middle_name,last_name,suffix,email,gender,category,philippine_address,province,region,position,jobsite,contact_number,departure_date,details,decision_reason,decided_at,created_at"
  ).eq("receipt_token_hash", hashReceiptToken(token)).maybeSingle();
  if (error || !data) throw new Error("Receipt not found or expired.");
  const name = [data.first_name, data.middle_name, data.last_name, data.suffix].filter(Boolean).join(" ");
  return {
    reference: data.reference, oecMasked: maskOec(data.oec_number),
    status: data.status, state: receiptState(data.status, data.expires_at),
    issuedAt: data.issued_at, expiresAt: data.expires_at,
    fullName: data.full_name, firstName: data.first_name, middleName: data.middle_name,
    lastName: data.last_name, suffix: data.suffix,
    oecNumber: data.oec_number, email: data.email,
    gender: data.gender, category: data.category,
    philippineAddress: data.philippine_address, province: data.province, region: data.region,
    position: data.position, jobsite: data.jobsite,
    contactNumber: data.contact_number, departureDate: data.departure_date, details: data.details,
    decisionReason: data.decision_reason, decidedAt: data.decided_at,
    submittedAt: data.created_at,
  };
}
