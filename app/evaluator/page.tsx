import Link from "next/link";
import { redirect } from "next/navigation";
import { requireActiveEvaluator } from "@/lib/auth";
import { getPendingQueue, getPendingCount, getDashboard } from "@/lib/actions/evaluator";
import { CheckCircle2, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

const date = (value: string) =>
  new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: "Asia/Manila",
  }).format(new Date(value));

async function load() {
  try {
    await requireActiveEvaluator();
    const [pending, pendingTotal, verifiedRes, rejectedRes, revokedRes] = await Promise.all([
      getPendingQueue(),
      getPendingCount(),
      getDashboard({ status: "verified" }),
      getDashboard({ status: "rejected" }),
      getDashboard({ status: "revoked" }),
    ]);
    return {
      pending,
      pendingTotal,
      verified: verifiedRes.total,
      rejected: rejectedRes.total,
      revoked: revokedRes.total,
    };
  } catch {
    redirect("/evaluator/login");
  }
}

export default async function EvaluatorQueue() {
  const { pending, pendingTotal, verified, rejected, revoked } = await load();

  return (
    <div className="evaluator-page">
      {/* Page header */}
      <div className="mb-8">
        <p className="text-xs font-bold tracking-wide text-primary mb-1 uppercase">
          Evaluator Workspace
        </p>
        <h1
          className="text-3xl font-normal text-foreground"
          style={{ fontFamily: "var(--font-display, Georgia, serif)" }}
        >
          Pending queue
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Submissions awaiting review, sorted by departure date. Earliest first.
        </p>
      </div>

      {/* Pending queue table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Next pending
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pending.length} awaiting · {verified} verified · {rejected}{" "}
              rejected · {revoked} revoked
            </p>
            {pendingTotal > 100 && (
              <p className="text-xs text-muted-foreground mt-1">
                Showing first 100 of {pendingTotal} pending submissions.
              </p>
            )}
          </div>
          <Link
            href="/evaluator/responses"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
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
                    Departure
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Reference
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Applicant
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Position / Employer
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Jobsite
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
                    <td className="px-5 py-3.5 text-muted-foreground whitespace-nowrap">
                      {s.departure_date
                        ? date(s.departure_date)
                        : "—"}
                    </td>
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
                    <td className="px-5 py-3.5">
                      <div className="text-foreground">{s.position}</div>
                      <div className="text-xs text-muted-foreground">
                        {s.employer}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {s.jobsite}
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
    </div>
  );
}
