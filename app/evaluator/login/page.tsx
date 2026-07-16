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
      {/* Left panel — brand / visual */}
      <div className="auth-visual" aria-hidden="true">
        <div className="auth-visual-content">
          <Image
            src="/dmw_logo.png"
            alt="Department of Migrant Workers"
            width={72}
            height={72}
            priority
            className="auth-logo"
          />
          <Image
            src="/bagong-pilipinas.png"
            alt="Bagong Pilipinas"
            width={108}
            height={36}
            className="auth-bp-logo"
          />
          <p className="auth-tagline">Secure verification for overseas<br />Filipino workers</p>
          <div className="auth-gold-rule" />
          <p className="auth-government">
            Department of Migrant Workers<br />
            Republic of the Philippines
          </p>
        </div>
      </div>

      {/* Right panel — sign-in */}
      <div className="auth-form-panel">
        <div className="auth-form-inner">
          <div className="auth-form-header">
            <Image
              src="/dmw_logo.png"
              alt=""
              width={36}
              height={36}
              priority
              className="auth-form-logo"
            />
            <div>
              <h1 className="auth-form-title">Evaluator sign in</h1>
              <p className="auth-form-subtitle">Use your assigned evaluator account.</p>
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
