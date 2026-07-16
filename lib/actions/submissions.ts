"use server";
import QRCode from "qrcode";
import { createSubmission, retrieveReceipt } from "./public";
import { headers } from "next/headers";
import { hashRateLimitKey, receiptUrl } from "../security";
import { PRIVACY_CONSENT_VERSION, publicApplicationSchema } from "../types";
export async function submitPublicApplication(form: FormData) {
  const fieldErrors: Record<string, string> = {}; const get = (name: string) => String(form.get(name) ?? "").trim();
  const parsed = publicApplicationSchema.safeParse({ firstName: get("firstName"), middleName: get("middleName"), lastName: get("lastName"), suffix: get("suffix"), fullName: get("fullName"), email: get("email"), oecNumber: get("oecNumber"), gender: get("gender"), category: get("category"), philippineAddress: get("philippineAddress"), province: get("province"), region: get("region"), position: get("position"), jobsite: get("jobsite"), contactNumber: get("contactNumber"), requestId: get("requestId"), consent: form.get("consent") });
  if (!parsed.success) for (const issue of parsed.error.issues) { const field = String(issue.path[0] ?? "form"); fieldErrors[field] ??= issue.message; }
  if (!parsed.success || form.get("consent") !== PRIVACY_CONSENT_VERSION) return { error: "Please correct the highlighted fields and provide privacy consent.", fieldErrors };
  let result: Awaited<ReturnType<typeof createSubmission>>;
  try { const h = await headers(); const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown"; result = await createSubmission(parsed.data, hashRateLimitKey(ip), hashRateLimitKey(parsed.data.email.toLowerCase())); } catch { return { error: "We could not submit your application. Please try again later.", fieldErrors: {} as Record<string, string> }; }
  return { referenceNumber: result.reference, token: result.token };
}
export async function getPublicReceipt(token: string) {
  try {
    const result = await retrieveReceipt(token);
    const qrCodeDataUrl = await QRCode.toDataURL(receiptUrl(token));
    return {
      referenceNumber: result.reference, status: result.status, state: result.state,
      issuedAt: result.issuedAt, expiresAt: result.expiresAt,
      fullName: result.fullName, firstName: result.firstName, middleName: result.middleName,
      lastName: result.lastName, suffix: result.suffix,
      oecNumber: result.oecNumber, email: result.email,
      gender: result.gender, category: result.category,
      philippineAddress: result.philippineAddress, province: result.province, region: result.region,
      employer: result.employer, position: result.position, jobsite: result.jobsite,
      contactNumber: result.contactNumber, departureDate: result.departureDate, details: result.details,
      decisionReason: result.decisionReason, decidedAt: result.decidedAt,
      submittedAt: result.submittedAt,
      qrCodeDataUrl,
    };
  } catch { return null; }
}
