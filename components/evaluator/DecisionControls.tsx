"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  rejectForEvaluator,
  revokeForEvaluator,
  verifyForEvaluator,
  resendForEvaluator,
} from "@/app/evaluator/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, RotateCcw, Send } from "lucide-react";

type Action = "verify" | "reject" | "revoke";

export default function DecisionControls({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState<Action | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const actionLabel =
    confirming === "verify"
      ? "Verify"
      : confirming === "reject"
      ? "Reject"
      : "Revoke receipt";

  const run = () => {
    if (!confirming) return;
    const action = confirming;
    setConfirming(null);
    setError("");
    startTransition(async () => {
      try {
        const result =
          action === "verify"
            ? await verifyForEvaluator(id)
            : action === "reject"
            ? await rejectForEvaluator(id, reason)
            : await revokeForEvaluator(id, reason);
        if (!result.ok) {
          toast.error("The decision could not be saved.");
          setError(
            "error" in result
              ? result.error
              : "The action could not be completed."
          );
          return;
        }
        setCurrentStatus(
          action === "verify"
            ? "verified"
            : action === "reject"
            ? "rejected"
            : "revoked"
        );
        if ("emailWarning" in result && result.emailWarning)
          toast.warning(
            "Decision saved; notification delivery could not be confirmed."
          );
        else
          toast.success(
            action === "verify"
              ? "Submission verified."
              : action === "reject"
              ? "Submission rejected."
              : "Receipt revoked."
          );
        router.refresh();
      } catch {
        toast.error("The decision could not be saved. Please try again.");
        setError("The action could not be completed.");
      }
    });
  };

  const resend = () => {
    setError("");
    startTransition(async () => {
      try {
        const result = await resendForEvaluator(id);
        if (!result.ok) {
          toast.error("Receipt email could not be sent.");
          setError(
            "error" in result
              ? result.error
              : "Receipt email could not be sent."
          );
        } else if ("emailWarning" in result && result.emailWarning)
          toast.warning(
            "Receipt email queued; delivery could not be confirmed."
          );
        else toast.success("Receipt email sent.");
      } catch {
        toast.error("Receipt email could not be sent. Please try again.");
        setError("Receipt email could not be sent.");
      }
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Decision</h2>
        <Badge
          variant={
            currentStatus === "verified"
              ? "default"
              : currentStatus === "pending"
              ? "secondary"
              : "destructive"
          }
        >
          {currentStatus}
        </Badge>
      </div>

      <div className="p-5 space-y-4">
        {currentStatus === "pending" && (
          <>
            <div className="space-y-2">
              <Label
                htmlFor="decision-reason"
                className="text-xs font-medium text-slate-600"
              >
                Remarks{" "}
                <span className="text-slate-400">(required to reject)</span>
              </Label>
              <Textarea
                id="decision-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={1000}
                placeholder="Add remarks for the record…"
                className="resize-none text-sm"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                disabled={pending}
                onClick={() => setConfirming("verify")}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                size="sm"
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                {pending ? "Processing…" : "Verify"}
              </Button>
              <Button
                disabled={pending || !reason.trim()}
                variant="destructive"
                onClick={() => setConfirming("reject")}
                className="flex-1"
                size="sm"
              >
                <XCircle className="h-4 w-4 mr-1.5" />
                Reject
              </Button>
            </div>
          </>
        )}

        {currentStatus === "verified" && (
          <>
            <div className="space-y-2">
              <Label
                htmlFor="revoke-reason"
                className="text-xs font-medium text-slate-600"
              >
                Revocation reason
              </Label>
              <Textarea
                id="revoke-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={1000}
                placeholder="Reason for revoking the receipt…"
                className="resize-none text-sm"
                rows={3}
              />
            </div>
            <Button
              disabled={pending || !reason.trim()}
              variant="destructive"
              onClick={() => setConfirming("revoke")}
              className="w-full"
              size="sm"
            >
              <RotateCcw className="h-4 w-4 mr-1.5" />
              {pending ? "Processing…" : "Revoke receipt"}
            </Button>
          </>
        )}

        {currentStatus !== "pending" && currentStatus !== "verified" && (
          <p className="text-sm text-slate-500 leading-relaxed">
            This submission has already been decided. Its status is the source
            of truth.
          </p>
        )}

        {/* Resend email action */}
        <div className="pt-3 border-t border-slate-100">
          <Button
            variant="outline"
            size="sm"
            disabled={pending || currentStatus !== "verified"}
            onClick={resend}
            className="w-full text-xs"
          >
            <Send className="h-3.5 w-3.5 mr-1.5" />
            Resend receipt email
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}
      </div>

      <AlertDialog
        open={!!confirming}
        onOpenChange={(open) => !open && setConfirming(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirm {actionLabel.toLowerCase()}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirming === "verify"
                ? "This will mark the submission as verified and issue the receipt."
                : confirming === "reject"
                ? "This will reject the submission using the recorded remarks."
                : "This will revoke the verified receipt. The applicant will be notified."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={run} disabled={pending}>
              {pending ? "Processing…" : actionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
