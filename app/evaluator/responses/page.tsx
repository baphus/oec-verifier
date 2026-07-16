import { redirect } from "next/navigation";
import { requireActiveEvaluator } from "@/lib/auth";
import { getAllSubmissions, getDecisionAuthors, getEmailDeliveriesBatch } from "@/lib/actions/evaluator";
import ResponseTools from "@/components/evaluator/ResponseTools";

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

export default async function ResponsesPage() {
  const rows = await load();
  return (
    <div className="evaluator-page">

      {/* Page header */}
      <div className="mb-8">
        <p className="text-xs font-bold tracking-wide text-primary mb-1 uppercase">
          All Records
        </p>
        <h1
          className="text-3xl font-normal text-foreground"
          style={{ fontFamily: "var(--font-display, Georgia, serif)" }}
        >
          Submissions
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Every submission available to your evaluator workspace. Filter, search,
          and review.
        </p>
      </div>

      <ResponseTools rows={rows} />
    </div>
  );
}
