import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import LoginForm from "@/components/evaluator/LoginForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function EvaluatorLoginPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/evaluator");
  return <main className="evaluator-shell evaluator-auth"><Card className="evaluator-card"><CardHeader><p className="eyebrow">OEC VERIFY · STAFF</p><CardTitle>Evaluator sign in</CardTitle><p className="muted">Use your assigned Supabase account. Evaluator access is provisioned by an administrator.</p></CardHeader><CardContent><LoginForm /></CardContent></Card></main>;
}
