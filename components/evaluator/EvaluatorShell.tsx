import { EvaluatorSidebar } from "./EvaluatorSidebar";

export function EvaluatorShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <EvaluatorSidebar />
      <main className="flex-1 overflow-y-auto bg-slate-50">
        <div className="evaluator-shell">{children}</div>
      </main>
    </div>
  );
}
