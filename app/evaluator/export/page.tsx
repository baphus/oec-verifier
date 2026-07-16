import { redirect } from "next/navigation";
import { requireActiveEvaluator } from "@/lib/auth";
import { getAllSubmissions } from "@/lib/actions/evaluator";
import ResponseTools from "@/components/evaluator/ResponseTools";

export const dynamic = "force-dynamic";

async function load() {
  try {
    await requireActiveEvaluator();
    const rows = await getAllSubmissions();
    return rows.map((r) => ({ ...r, decided_by_name: null }));
  } catch {
    redirect("/evaluator/login");
  }
}

export default async function ExportPage() {
  const rows = await load();
  return (
    <div className="evaluator-page max-w-4xl">

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
          Choose a date range, select the fields you need, and download a CSV.
        </p>
      </div>

      <ResponseTools rows={rows} exportMode />
    </div>
  );
}
