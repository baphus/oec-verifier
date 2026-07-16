import { redirect } from "next/navigation";
import { requireActiveEvaluator } from "@/lib/auth";
import { getAllSubmissions, getDecisionAuthors, getEmailDeliveriesBatch } from "@/lib/actions/evaluator";
import ResponseTools from "@/components/evaluator/ResponseTools";
import { AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

async function load() {
  try {
    await requireActiveEvaluator();
    const rows = await getAllSubmissions();
    const authorIds = Array.from(
      new Set(rows.map((r) => r.decided_by).filter(Boolean))
    ) as string[];
    const [authors, emailMap] = await Promise.all([
      authorIds.length ? getDecisionAuthors(authorIds) : Promise.resolve({} as Record<string, string>),
      getEmailDeliveriesBatch(rows.map((r) => r.id)),
    ]);
    return rows.map((r) => {
      const deliveries = emailMap[r.id] ?? [];
      const latest = deliveries[0] ?? null;
      return {
        ...r,
        decided_by_name: r.decided_by ? (authors[r.decided_by] ?? null) : null,
        latest_email_kind: latest?.kind ?? null,
        latest_email_status: latest?.status ?? null,
      };
    });
  } catch {
    redirect("/evaluator/login");
  }
}

export default async function ExportPage() {
  const rows = await load();
  return (
    <div className="evaluator-page">

      {/* Page header */}
      <div className="mb-8">
        <p className="text-xs font-bold tracking-wide text-primary mb-1 uppercase">
          Data Export
        </p>
        <h1
          className="text-3xl font-normal text-foreground"
          style={{ fontFamily: "var(--font-display, Georgia, serif)" }}
        >
          Export responses
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Choose a view, select the fields you need, and download a CSV for local
          use.
        </p>
      </div>

      {/* Notice banner */}
      <div className="flex items-start gap-3 p-4 mb-6 bg-warning-soft border border-border rounded-lg">
        <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-warning-foreground">
            Local export only
          </p>
          <p className="text-xs text-warning mt-0.5">
            This download is created in your browser from the records currently
            available to you. It is not a separate server report.
          </p>
        </div>
      </div>

      <ResponseTools rows={rows} exportMode />
    </div>
  );
}
