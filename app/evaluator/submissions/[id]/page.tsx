import Link from "next/link";
import { redirect } from "next/navigation";
import { requireActiveEvaluator } from "@/lib/auth";
import { getSubmission } from "@/lib/actions/evaluator";
import { recordSubmissionView } from "@/app/evaluator/actions";
import DecisionControls from "@/components/evaluator/DecisionControls";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
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
    return submission;
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
  const submission = await loadSubmission(id);

  const statusColor =
    submission.status === "verified"
      ? "default"
      : submission.status === "pending"
      ? "secondary"
      : "destructive";

  return (
    <main className="evaluator-shell">
      {/* Back navigation + header */}
      <div className="mb-6">
        <Link
          href="/evaluator"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#093CA8] transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to applications
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#093CA8] mb-1">
              Submission Review
            </p>
            <h1
              className="text-2xl font-normal text-slate-900"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {submission.reference}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
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
          <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <User className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900">
                Personal Information
              </h2>
            </div>
            <div className="p-5">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Full name
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-slate-900">
                    {submission.full_name}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Email
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    {submission.email}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Gender
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    {submission.gender}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Category
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    {submission.category}
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          {/* Location / Address */}
          <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900">
                Address & Contact
              </h2>
            </div>
            <div className="p-5">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Philippine address
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    {submission.philippine_address}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Province
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    {submission.province}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Region
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    {submission.region}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Phone className="h-3 w-3" /> International contact
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    {submission.contact_number}
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          {/* Employment / OEC Details */}
          <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900">
                Employment & OEC Details
              </h2>
            </div>
            <div className="p-5">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <FileText className="h-3 w-3" /> OEC number
                  </dt>
                  <dd className="mt-1 text-sm font-mono text-slate-900">
                    {submission.oec_number}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Position
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    {submission.position}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Employer / Agency
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    {submission.employer}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Globe className="h-3 w-3" /> Jobsite / Destination
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    {submission.jobsite}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Departure date
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    {submission.departure_date}
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          {/* Additional details */}
          {submission.details && (
            <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-900">
                  Additional Details
                </h2>
              </div>
              <div className="p-5">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {submission.details}
                </p>
              </div>
            </section>
          )}

          {/* Timeline / Dates */}
          <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900">
                Timeline
              </h2>
            </div>
            <div className="p-5">
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-5">
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Submitted
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    {date(submission.created_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Issued
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    {date(submission.issued_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Expires
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900">
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

          {/* Decision record */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <Shield className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900">
                Decision Record
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Current status
                </p>
                <p className="mt-1">
                  <Badge variant={statusColor}>{submission.status}</Badge>
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Decided at
                </p>
                <p className="mt-1 text-sm text-slate-900">
                  {date(submission.decided_at)}
                </p>
              </div>
              {submission.decision_reason && (
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Remarks
                  </p>
                  <p className="mt-1 text-sm text-slate-700 leading-relaxed">
                    {submission.decision_reason}
                  </p>
                </div>
              )}
              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Viewing this record is audited without storing applicant
                  details in the audit event.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
