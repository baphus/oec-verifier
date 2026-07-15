import { createAdminClient } from "./supabase/admin";
// Metadata is allowlisted: never pass names, email, OECs, raw tokens, or arbitrary error objects.
const safeActions = ["submission_created", "submission_viewed", "verified", "rejected", "revoked", "email_resent", "login", "logout"] as const;
export async function logAudit(action: (typeof safeActions)[number], actorId: string | null, submissionId: string | null, metadata: Record<string, string | number | boolean> = {}) {
  if (!safeActions.includes(action)) return;
  const safe = Object.fromEntries(Object.entries(metadata).filter(([key]) => /^(channel|reason_code|result|attempt)$/.test(key)));
  const { error } = await createAdminClient().from("audit_logs").insert({ action, actor_id: actorId, submission_id: submissionId, metadata: safe });
  if (error) throw new Error("Audit logging failed.");
}
