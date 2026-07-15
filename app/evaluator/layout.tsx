import "./evaluator.css";
import { EvaluatorShell } from "@/components/evaluator/EvaluatorShell";

export default function EvaluatorLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <EvaluatorShell>{children}</EvaluatorShell>;
}
