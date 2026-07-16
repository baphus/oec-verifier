import Link from "next/link";
import { PageFrame } from "@/components/public/Shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ConfettiEffect from "@/components/public/ConfettiEffect";

export default function SuccessPage() {
  return (
    <PageFrame title="Submission received" intro="Your application has been submitted successfully.">
      <ConfettiEffect />
      <Card className="success-card">
        <span className="success-icon" aria-hidden="true">✓</span>
        <h2>Application received</h2>
        <p>Your application is now <strong>under review</strong>. Our evaluators will review your submission and you will receive an email once a decision has been made.</p>
        <p className="muted-copy">Please allow some time for the review process. We appreciate your patience.</p>
        <div className="success-actions">
          <Button asChild>
            <Link href="/">Return home</Link>
          </Button>
          <Link className="text-link" href="/apply">Start another application</Link>
        </div>
      </Card>
    </PageFrame>
  );
}
