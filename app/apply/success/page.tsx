import Link from "next/link";
import { PageFrame } from "@/components/public/Shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ emailWarning?: string }> }) {
  const params = await searchParams; const emailWarning = params.emailWarning === "1";
  return <PageFrame eyebrow="Submission received" title="You’re all set." intro="Your application has been received for review."><Card className="success-card"><span className="success-icon" aria-hidden="true">✓</span><h2>Application received</h2>{emailWarning ? <p>We received your application, but notification delivery is being retried. Check your email later or contact support if it does not arrive.</p> : <p>Your confirmation and reference number will be sent through the contact details you provided.</p>}<p className="muted-copy">We’ll contact you if we need anything else. Keep your confirmation for your records.</p><div className="success-actions"><Button asChild><Link href="/">Return home</Link></Button><Link className="text-link" href="/apply">Start another application</Link></div></Card></PageFrame>;
}
