"use server";

import { redirect } from "next/navigation";
import { requireActiveEvaluator } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { authenticateEvaluator, logout } from "@/lib/actions/auth";
import { rejectSubmission, resendReceiptEmail, revokeSubmission, verifySubmission } from "@/lib/actions/evaluator";
import { revalidatePath } from "next/cache";

export async function evaluatorLogin(input: { email: string; password: string }): Promise<{ ok: boolean; error?: string }> {
  try {
    await authenticateEvaluator(input); return { ok: true };
  } catch {
    return { ok: false, error: "Invalid email or password." };
  }
}

export async function evaluatorLogout() {
  await logout();
  redirect("/evaluator/login");
}

export async function recordSubmissionView(id: string) {
  const { user } = await requireActiveEvaluator();
  await logAudit("submission_viewed", user.id, id);
}
export async function verifyForEvaluator(id: string) { try { const result = await verifySubmission(id); revalidatePath(`/evaluator/submissions/${id}`); return result; } catch { return { ok: false, error: "This submission could not be verified. It may already have a decision." }; } }
export async function rejectForEvaluator(id: string, reason: string) { if (!reason.trim()) return { ok: false, error: "Remarks are required when rejecting." }; try { const result = await rejectSubmission(id, reason); revalidatePath(`/evaluator/submissions/${id}`); return result; } catch { return { ok: false, error: "This submission could not be rejected. It may already have a decision." }; } }
export async function revokeForEvaluator(id: string, reason: string) { if (!reason.trim()) return { ok: false, error: "A revocation reason is required." }; try { const result = await revokeSubmission(id, reason); revalidatePath(`/evaluator/submissions/${id}`); return result; } catch { return { ok: false, error: "Only a verified submission can be revoked." }; } }
export async function resendForEvaluator(id: string) { try { const result = await resendReceiptEmail(id); revalidatePath(`/evaluator/submissions/${id}`); return result; } catch { return { ok: false, error: "Receipt email could not be sent. The decision was preserved." }; } }
