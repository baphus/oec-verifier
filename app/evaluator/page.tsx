import Link from "next/link";
import { redirect } from "next/navigation";
import { requireActiveEvaluator } from "@/lib/auth";
import { getDashboard, getAllSubmissions } from "@/lib/actions/evaluator";
import { EvaluatorNav } from "@/components/evaluator/EvaluatorNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  ArrowRight,
  Search,
} from "lucide-react";

export const dynamic = "force-dynamic";
type Params = Promise<{ status?: string; q?: string; page?: string }>;
const statuses = ["", "pending", "verified", "rejected", "revoked"] as const;
const date = (value: string) =>
  new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: "Asia/Manila",
  }).format(new Date(value));

async function load(searchParams: Params) {
  try {
    await requireActiveEvaluator();
    const params = await searchParams;
    const status = statuses.includes(
      (params.status ?? "") as (typeof statuses)[number]
    )
      ? params.status || undefined
      : undefined;
    const page = Math.max(0, Number.parseInt(params.page ?? "0", 10) || 0);
    return {
      params,
      status,
      result: await getDashboard({ status, query: params.q, page }),
      all: await getAllSubmissions(),
    };
  } catch {
    redirect("/evaluator/login");
  }
}

export default async function EvaluatorDashboard({
  searchParams,
}: {
  searchParams: Params;
}) {
  const { params, status, result, all } = await load(searchParams);
  const pending = all.filter((x) => x.status === "pending").length;
  const verified = all.filter((x) => x.status === "verified").length;
  const rejected = all.filter((x) => x.status === "rejected").length;
  const revoked = all.filter((x) => x.status === "revoked").length;

  return (
    <main className="evaluator-shell">
      <EvaluatorNav />

      {/* Page header */}
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#093CA8] mb-1">
          Evaluator Workspace
        </p>
        <h1 className="text-3xl font-normal text-slate-900" style={{ fontFamily: "Georgia, serif" }}>
          Operations overview
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review submissions, track decisions, and manage the verification queue.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-lg p-5 flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
            <FileText className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total submissions</p>
            <p className="text-2xl font-semibold text-slate-900 mt-0.5">{all.length}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5 flex items-start gap-4 border-t-[3px] border-t-amber-500">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Needs review</p>
            <p className="text-2xl font-semibold text-slate-900 mt-0.5">{pending}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5 flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Verified</p>
            <p className="text-2xl font-semibold text-slate-900 mt-0.5">{verified}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5 flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
            <XCircle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Rejected / Revoked</p>
            <p className="text-2xl font-semibold text-slate-900 mt-0.5">
              {rejected + revoked}
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar: Search + Filters */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <form className="flex items-center gap-2 min-w-[280px] flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                name="q"
                defaultValue={params.q}
                placeholder="Search name, reference, or OEC…"
                aria-label="Search submissions"
                className="pl-9"
              />
            </div>
            <input type="hidden" name="status" value={params.status ?? ""} />
            <Button type="submit" size="sm">
              Search
            </Button>
          </form>

          <nav className="flex flex-wrap items-center gap-1" aria-label="Filter submissions">
            {statuses.map((item) => {
              const active = (status ?? "") === (item || "");
              return (
                <Link
                  key={item || "all"}
                  href={`/evaluator?${new URLSearchParams({
                    ...(params.q ? { q: params.q } : {}),
                    ...(item ? { status: item } : {}),
                  })}`}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    active
                      ? "bg-[#093CA8] text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {item
                    ? item[0].toUpperCase() + item.slice(1)
                    : "All"}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Submissions table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Recent applications
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {result.total} total · showing {result.submissions.length} results
            </p>
          </div>
          <Link
            href="/evaluator/responses"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#093CA8] hover:underline"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {result.submissions.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[800px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Date
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Reference
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Applicant
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Position / Employer
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.submissions.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                      {date(s.created_at)}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-700">
                      {s.reference}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-900">
                        {s.full_name}
                      </div>
                      <div className="text-xs text-slate-500">{s.email}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-slate-700">{s.position}</div>
                      <div className="text-xs text-slate-500">
                        {s.employer}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={
                          s.status === "verified"
                            ? "default"
                            : s.status === "pending"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {s.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/evaluator/submissions/${s.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#093CA8] hover:underline"
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
            <AlertTriangle className="h-8 w-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">
              No applications match these filters.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
