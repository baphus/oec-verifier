import Link from "next/link";
import { redirect } from "next/navigation";
import { requireActiveEvaluator } from "@/lib/auth";
import { getSubmission, getPendingQueue, getDecisionAuthors } from "@/lib/actions/evaluator";
import { recordSubmissionView } from "@/app/evaluator/actions";
import DecisionControls from "@/components/evaluator/DecisionControls";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  User,
  Mail,
  MapPin,
  Briefcase,
  Globe,
  Phone,
  Calendar,
  FileText,
  Clock,
  Shield,
} from "lucide-react";

export const dynamic = "force-dynamic";

const date = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Manila",
      }).format(new Date(value))
    : "—";

async function loadSubmission(id: string) {
  try {
    await requireActiveEvaluator();
    const submission = await getSubmission(id);
    await recordSubmissionView(id);
    let evaluatedBy: string | null = null;
    if (submission.decided_by) {
      const authors = await getDecisionAuthors([submission.decided_by]);
      evaluatedBy = authors[submission.decided_by] ?? null;
    }
    return { submission, evaluatedBy };
  } catch {
    redirect("/evaluator");
  }
}

export default async function SubmissionReview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ submission, evaluatedBy }, pendingQueue] = await Promise.all([
    loadSubmission(id),
    getPendingQueue(),
  ]);

  // Find the next pending submission after this one (by departure date)
  const currentIndex = pendingQueue.findIndex((s) => s.id === id);
  const nextPending =
    currentIndex >= 0
      ? pendingQueue[currentIndex + 1] ?? null
      : pendingQueue[0] ?? null;
  const remainingCount =
    currentIndex >= 0
      ? pendingQueue.length - currentIndex - 1
      : pendingQueue.length;

  const statusColor =
    submission.status === "verified"
      ? "default"
      : submission.status === "pending"
        ? "secondary"
        : "destructive";

  return (
    <div className="evaluator-page">
      {/* Back navigation + header */}
      <div className="mb-6">
        <Link
          href="/evaluator"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to queue
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-bold tracking-wide text-primary mb-1 uppercase">
              Submission Review
            </p>
            <h1
              className="text-2xl font-normal text-foreground"
              style={{ fontFamily: "var(--font-display, Georgia, serif)" }}
            >
              {submission.reference}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Submitted {date(submission.created_at)}
            </p>
          </div>
          <Badge variant={statusColor} className="text-sm px-3 py-1">
            {submission.status}
          </Badge>
        </div>
      </div>

      {/* Two-column layout: details + decision panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Application details (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <section className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">
                Personal Information
              </h2>
            </div>
            <div className="p-5">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Full name
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {submission.full_name}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Email
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {submission.email}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Gender
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {submission.gender}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Category
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {submission.category}
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          {/* Location / Address */}
          <section className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">
                Address & Contact
              </h2>
            </div>
            <div className="p-5">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Philippine address
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {submission.philippine_address}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Province
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {submission.province}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Region
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {submission.region}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Phone className="h-3 w-3" /> International contact
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {submission.contact_number}
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          {/* Employment / OEC Details */}
          <section className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">
                Employment & OEC Details
              </h2>
            </div>
            <div className="p-5">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <FileText className="h-3 w-3" /> OEC number
                  </dt>
                  <dd className="mt-1 text-sm font-mono text-foreground">
                    {submission.oec_number}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Position
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {submission.position}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Employer / Agency
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {submission.employer}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Globe className="h-3 w-3" /> Jobsite / Destination
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {submission.jobsite}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Departure date
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {submission.departure_date}
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          {/* Additional details */}
          {submission.details && (
            <section className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">
                  Additional Details
                </h2>
              </div>
              <div className="p-5">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {submission.details}
                </p>
              </div>
            </section>
          )}

          {/* Timeline / Dates */}
          <section className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">
                Timeline
              </h2>
            </div>
            <div className="p-5">
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-5">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Submitted
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {date(submission.created_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Issued
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {date(submission.issued_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Expires
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {date(submission.expires_at)}
                  </dd>
                </div>
              </dl>
            </div>
          </section>
        </div>

        {/* Right: Decision panel (1/3 width) */}
        <aside className="space-y-6">
          {/* Decision controls */}
          <DecisionControls id={id} status={submission.status} />

          {/* Next pending CTA or closure card */}
          {submission.status !== "pending" &&
            (remainingCount > 0 && nextPending ? (
              <Link
                href={`/evaluator/submissions/${nextPending.id}`}
                className="flex items-center justify-between gap-3 bg-card border border-border rounded-lg p-4 transition-colors hover:bg-muted group"
              >
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">
                    {remainingCount} pending remaining
                  </p>
                  <p className="text-sm font-medium text-foreground truncate">
                    Next: {nextPending.full_name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    Departs{" "}
                    {nextPending.departure_date
                      ? date(nextPending.departure_date)
                      : "—"}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-primary shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ) : (
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm font-medium text-foreground">
                  Queue clear
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  All submissions have been reviewed.
                </p>
                <Link
                  href="/evaluator"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline mt-2"
                >
                  Back to queue
                </Link>
              </div>
            ))}

          {/* Decision record */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">
                Decision Record
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Current status
                </p>
                <p className="mt-1">
                  <Badge variant={statusColor}>{submission.status}</Badge>
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Decided at
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {date(submission.decided_at)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Evaluated by
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {evaluatedBy ?? "—"}
                </p>
              </div>
              {submission.decision_reason && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Remarks
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    {submission.decision_reason}
                  </p>
                </div>
              )}
              <div className="pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Viewing this record is audited without storing applicant
                  details in the audit event.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
