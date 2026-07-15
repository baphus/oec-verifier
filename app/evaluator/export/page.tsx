import { redirect } from "next/navigation";
import { requireActiveEvaluator } from "@/lib/auth";
import { getAllSubmissions } from "@/lib/actions/evaluator";
import { EvaluatorNav } from "@/components/evaluator/EvaluatorNav";
import ResponseTools from "@/components/evaluator/ResponseTools";
import { AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

async function load() {
  try {
    await requireActiveEvaluator();
    return await getAllSubmissions();
  } catch {
    redirect("/evaluator/login");
  }
}

export default async function ExportPage() {
  const rows = await load();
  return (
    <main className="evaluator-shell">
      <EvaluatorNav />

      {/* Page header */}
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#093CA8] mb-1">
          Data Export
        </p>
        <h1
          className="text-3xl font-normal text-slate-900"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Export responses
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Choose a view, select the fields you need, and download a CSV for local
          use.
        </p>
      </div>

      {/* Notice banner */}
      <div className="flex items-start gap-3 p-4 mb-6 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-900">
            Local export only
          </p>
          <p className="text-xs text-amber-700 mt-0.5">
            This download is created in your browser from the records currently
            available to you. It is not a separate server report.
          </p>
        </div>
      </div>

      <ResponseTools rows={rows} exportMode />
    </main>
  );
}
