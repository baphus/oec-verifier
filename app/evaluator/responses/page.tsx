import { redirect } from "next/navigation";
import { requireActiveEvaluator } from "@/lib/auth";
import { getAllSubmissions } from "@/lib/actions/evaluator";
import { EvaluatorNav } from "@/components/evaluator/EvaluatorNav";
import ResponseTools from "@/components/evaluator/ResponseTools";

export const dynamic = "force-dynamic";

async function load() {
  try {
    await requireActiveEvaluator();
    return await getAllSubmissions();
  } catch {
    redirect("/evaluator/login");
  }
}

export default async function ResponsesPage() {
  const rows = await load();
  return (
    <main className="evaluator-shell">
      <EvaluatorNav />

      {/* Page header */}
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#093CA8] mb-1">
          All Records
        </p>
        <h1
          className="text-3xl font-normal text-slate-900"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Submissions
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Every submission available to your evaluator workspace. Filter, search,
          and review.
        </p>
      </div>

      <ResponseTools rows={rows} />
    </main>
  );
}
