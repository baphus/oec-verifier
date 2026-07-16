import Link from "next/link";
import { redirect } from "next/navigation";
import { requireActiveEvaluator } from "@/lib/auth";
import { getPendingQueue, getPendingCount, getDashboard, getEvaluatorProfile } from "@/lib/actions/evaluator";
import {
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight,
  Users,
  FileText,
  Activity,
} from "lucide-react";

export const dynamic = "force-dynamic";

const date = (value: string) =>
  new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: "Asia/Manila",
  }).format(new Date(value));

const today = () =>
  new Intl.DateTimeFormat("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(new Date());

async function load() {
  try {
    await requireActiveEvaluator();
    const [pending, pendingTotal, verifiedRes, rejectedRes, revokedRes, profile] = await Promise.all([
      getPendingQueue(),
      getPendingCount(),
      getDashboard({ status: "verified" }),
      getDashboard({ status: "rejected" }),
      getDashboard({ status: "revoked" }),
      getEvaluatorProfile(),
    ]);
    return {
      pending,
      pendingTotal,
      verified: verifiedRes.total,
      rejected: rejectedRes.total,
      revoked: revokedRes.total,
      profile,
    };
  } catch {
    redirect("/evaluator/login");
  }
}

export default async function EvaluatorDashboard() {
  const { pending, pendingTotal, verified, rejected, revoked, profile } = await load();
  const total = pendingTotal + verified + rejected + revoked;

  return (
    <div className="evaluator-page">
      {/* Greeting + date */}
      <div className="mb-8">
        <p className="text-xs font-bold tracking-wide text-primary mb-1 uppercase">
          Evaluator Workspace
        </p>
        <h1
          className="text-3xl font-normal text-foreground"
          style={{ fontFamily: "var(--font-display, Georgia, serif)" }}
        >
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"},{profile.display_name || "Evaluator"}.
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {today()} &middot; {total} submission{total === 1 ? "" : "s"} in the workspace
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Pending
            </span>
            <Clock className="h-4 w-4 text-warning" />
          </div>
          <p className="text-3xl font-normal text-foreground">{pendingTotal}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-xs text-muted-foreground">
              {pendingTotal > 100 ? "First 100 shown" : `${pending.length} in queue`}
            </span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Verified
            </span>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </div>
          <p className="text-3xl font-normal text-foreground">{verified}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-xs text-muted-foreground">
              {total > 0 ? `${Math.round((verified / total) * 100)}% of total` : "No data"}
            </span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Rejected
            </span>
            <XCircle className="h-4 w-4 text-destructive" />
          </div>
          <p className="text-3xl font-normal text-foreground">{rejected}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-xs text-muted-foreground">
              {total > 0 ? `${Math.round((rejected / total) * 100)}% of total` : "No data"}
            </span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Revoked
            </span>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-normal text-foreground">{revoked}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-xs text-muted-foreground">
              {total > 0 ? `${Math.round((revoked / total) * 100)}% of total` : "No data"}
            </span>
          </div>
        </div>
      </div>

      {/* Two-column layout: Pending queue + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending queue */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-warning" />
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Pending queue
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Submissions awaiting review, sorted by submission time
                </p>
              </div>
            </div>
            <Link
              href="/evaluator/responses"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline shrink-0"
            >
              All submissions <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {pending.length ? (
            <div
              className="overflow-x-auto"
              role="region"
              aria-label="Pending submissions queue"
              tabIndex={0}
            >
              <table className="w-full text-sm text-left min-w-[700px]">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Reference
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Applicant
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      OEC No.
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Position / Jobsite
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Category
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pending.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-muted/60 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-mono text-xs text-foreground">
                        {s.reference}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-foreground">
                          {s.full_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {s.email}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-foreground">
                        {s.oec_number}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-foreground">{s.position}</div>
                        <div className="text-xs text-muted-foreground">
                          {s.jobsite}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {s.category}
                      </td>
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/evaluator/submissions/${s.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          Review <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                All submissions have been reviewed.
              </p>
            </div>
          )}
        </div>

        {/* Right sidebar — summary stats */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">
                Summary
              </h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total</span>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {total}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-warning" />
                  <span className="text-sm text-muted-foreground">Pending</span>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {pendingTotal}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  <span className="text-sm text-muted-foreground">
                    Verified
                  </span>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {verified}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-3.5 w-3.5 text-destructive" />
                  <span className="text-sm text-muted-foreground">
                    Rejected
                  </span>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {rejected}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Revoked
                  </span>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {revoked}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">
                Quick actions
              </h2>
            </div>
            <div className="space-y-2">
              <Link
                href="/evaluator/responses"
                className="flex items-center justify-between rounded-sm px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                View all submissions
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/evaluator/export"
                className="flex items-center justify-between rounded-sm px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                Export data
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/evaluator/account"
                className="flex items-center justify-between rounded-sm px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                Account settings
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
