import Link from "next/link";
import { redirect } from "next/navigation";
import { requireActiveEvaluator } from "@/lib/auth";
import { getSubmission } from "@/lib/actions/evaluator";
import { recordSubmissionView } from "@/app/evaluator/actions";
import DecisionControls from "@/components/evaluator/DecisionControls";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";
const date = (value: string | null) => value ? new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(value)) : "—";
async function loadSubmission(id: string) {
  try {
    await requireActiveEvaluator(); const submission = await getSubmission(id); await recordSubmissionView(id); return submission;
  } catch { redirect("/evaluator"); }
}
export default async function SubmissionReview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const submission = await loadSubmission(id);
    return <main className="evaluator-shell"><header className="evaluator-header"><div><Link className="text-link" href="/evaluator">← Back to applications</Link><p className="eyebrow">SUBMISSION REVIEW</p><h1>{submission.reference}</h1></div><Badge variant={submission.status === "verified" ? "default" : submission.status === "pending" ? "secondary" : "destructive"}>{submission.status}</Badge></header><div className="review-grid"><Card className="detail-card"><CardHeader><CardTitle>Application details</CardTitle></CardHeader><CardContent><dl className="detail-list"><div><dt>Full name</dt><dd>{submission.full_name}</dd></div><div><dt>Email</dt><dd>{submission.email}</dd></div><div><dt>OEC number</dt><dd className="mono">{submission.oec_number}</dd></div><div><dt>Category / position</dt><dd>{submission.category} / {submission.position}</dd></div><div><dt>Philippine address</dt><dd>{submission.philippine_address}, {submission.province}, {submission.region}</dd></div><div><dt>Jobsite / employer</dt><dd>{submission.jobsite} / {submission.employer}</dd></div><div><dt>International contact</dt><dd>{submission.contact_number}</dd></div><div><dt>Departure date</dt><dd>{submission.departure_date}</dd></div><div><dt>Additional details</dt><dd>{submission.details || "—"}</dd></div><div><dt>Issued</dt><dd>{date(submission.issued_at)}</dd></div><div><dt>Expires</dt><dd>{date(submission.expires_at)}</dd></div><div><dt>Submitted</dt><dd>{date(submission.created_at)}</dd></div></dl></CardContent></Card><aside><DecisionControls id={id} status={submission.status} /><Card className="audit-summary"><CardHeader><CardTitle>Decision record</CardTitle></CardHeader><CardContent><p><strong>Status</strong><br />{submission.status}</p><p><strong>Decided</strong><br />{date(submission.decided_at)}</p>{submission.decision_reason && <p><strong>Remarks</strong><br />{submission.decision_reason}</p>}<p className="muted">Viewing this record is audited without storing applicant details in the audit event.</p></CardContent></Card></aside></div></main>;
}
