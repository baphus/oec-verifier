import { EvaluatorSidebar } from "./EvaluatorSidebar";

export function EvaluatorShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="evaluator-layout flex min-h-screen">
      <EvaluatorSidebar />
      <main className="evaluator-main flex-1 overflow-y-auto">
        <div className="evaluator-content">{children}</div>
      </main>
    </div>
  );
}
