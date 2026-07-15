import { z } from "zod";

export const submissionStatus = ["pending", "verified", "rejected", "revoked"] as const;
export type SubmissionStatus = (typeof submissionStatus)[number];
export const profileRole = ["evaluator", "admin"] as const;
export type ProfileRole = (typeof profileRole)[number];

const text = (max: number) => z.string().trim().min(1).max(max);
export const submissionSchema = z.object({
  fullName: text(150), email: z.string().trim().email().max(254),
  oecNumber: text(50).regex(/^[A-Za-z0-9][A-Za-z0-9\- /]{2,49}$/),
  employer: text(200), position: text(150),
  issuedAt: z.coerce.date(), expiresAt: z.coerce.date(),
}).superRefine((v, ctx) => { if (v.expiresAt <= v.issuedAt) ctx.addIssue({ code: "custom", path: ["expiresAt"], message: "Expiry must follow issue date" }); });
export type SubmissionInput = z.infer<typeof submissionSchema>;
export const PRIVACY_CONSENT_VERSION = "oec-privacy-v1" as const;
export const requestIdSchema = z.string().uuid();
export const publicApplicationSchema = z.object({
  firstName: text(80), middleName: text(80), lastName: text(80), suffix: z.string().trim().max(30).optional().default(""),
  fullName: z.string().trim().max(150).optional(), email: z.string().trim().email().max(254), oecNumber: text(50).regex(/^[A-Za-z0-9][A-Za-z0-9\- /]{2,49}$/),
  gender: text(40), category: text(100), philippineAddress: text(300), province: text(100), region: text(100),
  position: text(150), jobsite: text(200), contactNumber: text(40), requestId: requestIdSchema, consent: z.literal(PRIVACY_CONSENT_VERSION),
});
export type PublicApplicationInput = z.infer<typeof publicApplicationSchema>;

export const decisionSchema = z.object({ id: z.string().uuid(), reason: z.string().trim().max(1000).optional() });
export const idSchema = z.string().uuid();
export const searchSchema = z.object({ query: z.string().trim().max(100).optional(), status: z.enum(submissionStatus).optional(), page: z.number().int().min(0).max(10000).default(0) });
export type SubmissionRecord = { id: string; reference: string; first_name: string; middle_name: string; last_name: string; suffix: string; full_name: string; email: string; oec_number: string; gender: string; category: string; philippine_address: string; province: string; region: string; employer: string; position: string; jobsite: string; contact_number: string; departure_date: string; details: string; issued_at: string; expires_at: string; status: SubmissionStatus; decision_reason: string | null; decided_at: string | null; decided_by: string | null; created_at: string };
export type PublicReceipt = { reference: string; oecMasked: string; status: SubmissionStatus; state: "valid" | "expired" | "revoked" | "invalid"; issuedAt: string; expiresAt: string };
