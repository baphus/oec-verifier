"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { rejectForEvaluator, revokeForEvaluator, verifyForEvaluator, resendForEvaluator } from "@/app/evaluator/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Action = "verify" | "reject" | "revoke";

export default function DecisionControls({ id, status }: { id: string; status: string }) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState<Action | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const actionLabel = confirming === "verify" ? "Verify" : confirming === "reject" ? "Reject" : "Revoke receipt";

  const run = () => {
    if (!confirming) return;
    const action = confirming;
    setConfirming(null); setError("");
    startTransition(async () => {
      try {
        const result = action === "verify" ? await verifyForEvaluator(id) : action === "reject" ? await rejectForEvaluator(id, reason) : await revokeForEvaluator(id, reason);
        if (!result.ok) { toast.error("The decision could not be saved."); setError("error" in result ? result.error : "The action could not be completed."); return; }
        setCurrentStatus(action === "verify" ? "verified" : action === "reject" ? "rejected" : "revoked");
        if ("emailWarning" in result && result.emailWarning) toast.warning("Decision saved; notification delivery could not be confirmed.");
        else toast.success(action === "verify" ? "Submission verified." : action === "reject" ? "Submission rejected." : "Receipt revoked.");
        router.refresh();
      } catch { toast.error("The decision could not be saved. Please try again."); setError("The action could not be completed."); }
    });
  };

  const resend = () => {
    setError("");
    startTransition(async () => {
      try {
        const result = await resendForEvaluator(id);
        if (!result.ok) { toast.error("Receipt email could not be sent."); setError("error" in result ? result.error : "Receipt email could not be sent."); }
        else if ("emailWarning" in result && result.emailWarning) toast.warning("Receipt email queued; delivery could not be confirmed.");
        else toast.success("Receipt email sent.");
      } catch { toast.error("Receipt email could not be sent. Please try again."); setError("Receipt email could not be sent."); }
    });
  };

  return <div className="decision-panel"><div className="decision-title"><h2>Decision</h2><Badge variant={currentStatus === "verified" ? "default" : currentStatus === "pending" ? "secondary" : "destructive"}>{currentStatus}</Badge></div>{currentStatus === "pending" && <><Label htmlFor="decision-reason">Remarks <span>(required to reject)</span></Label><Textarea id="decision-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} placeholder="Add remarks for the record" /><div className="decision-actions"><Button disabled={pending} onClick={() => setConfirming("verify")}>{pending ? "Processing…" : "Verify"}</Button><Button disabled={pending || !reason.trim()} variant="destructive" onClick={() => setConfirming("reject")}>Reject</Button></div></>}{currentStatus === "verified" && <><Label htmlFor="revoke-reason">Revocation reason</Label><Textarea id="revoke-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} /><Button disabled={pending || !reason.trim()} variant="destructive" onClick={() => setConfirming("revoke")}>{pending ? "Processing…" : "Revoke receipt"}</Button></>}{currentStatus !== "pending" && currentStatus !== "verified" && <p className="muted">This submission has already been decided. Its status is the source of truth.</p>}<div className="email-actions"><Button variant="link" disabled={pending || currentStatus !== "verified"} onClick={resend}>Resend receipt email</Button></div>{error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}<AlertDialog open={!!confirming} onOpenChange={(open) => !open && setConfirming(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirm {actionLabel.toLowerCase()}?</AlertDialogTitle><AlertDialogDescription>{confirming === "verify" ? "This will mark the submission as verified." : confirming === "reject" ? "This will reject the submission using the recorded remarks." : "This will revoke the verified receipt."}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel><AlertDialogAction onClick={run} disabled={pending}>{pending ? "Processing…" : actionLabel}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div>;
}
