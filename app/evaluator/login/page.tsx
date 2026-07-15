import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import LoginForm from "@/components/evaluator/LoginForm";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EvaluatorLoginPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/evaluator");

  return (
    <div className="evaluator-auth">
      {/* Left panel — visual / brand */}
      <div className="auth-visual" aria-hidden="true">
        <div className="auth-visual-content">
          <Image
            src="/dmw_logo.png"
            alt="Department of Migrant Workers"
            width={56}
            height={56}
            priority
            className="auth-logo"
          />
          <h2 className="auth-headline">
            Secure verification for Filipinos working abroad
          </h2>
        </div>
      </div>

      {/* Right panel — sign-in form */}
      <div className="auth-form-panel">
        <div className="auth-form-inner">
          <div className="auth-form-header">
            <Image
              src="/dmw_logo.png"
              alt="Department of Migrant Workers"
              width={40}
              height={40}
              priority
              className="auth-form-logo"
            />
            <div>
              <h1 className="auth-form-title">Evaluator sign in</h1>
              <p className="auth-form-subtitle">
                Sign in with your assigned evaluator account.
              </p>
            </div>
          </div>

          <LoginForm />

          <Link href="/" className="back-public">
            &larr; Return to public service
          </Link>
        </div>
      </div>
    </div>
  );
}
