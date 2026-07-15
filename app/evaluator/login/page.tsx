import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import LoginForm from "@/components/evaluator/LoginForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EvaluatorLoginPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/evaluator");
  return <div className="evaluator-page evaluator-auth"><Card className="evaluator-card"><CardHeader><Link href="/" className="login-brand"><Image src="/dmw_logo.png" alt="Department of Migrant Workers" width={76} height={76} priority /></Link><p className="eyebrow">OEC VERIFY · STAFF ACCESS</p><CardTitle>Evaluator sign in</CardTitle><p className="muted">Use your assigned account. Evaluator access is provisioned by an administrator.</p></CardHeader><CardContent><LoginForm /></CardContent></Card><Link className="back-public" href="/">← Return to public service</Link></div>;
}
