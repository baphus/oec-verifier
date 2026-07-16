import Link from "next/link";
import Image from "next/image";
import { PublicHeader, PublicFooter } from "@/components/public/Shell";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="public-page">
      <PublicHeader />
      <main>
        <section className="hero-shell">
          <div className="hero-copy">
            <h1>Make your airport application with confidence.</h1>
            <p className="hero-lede">
              Submit your application for airport access in a few clear steps. You&apos;ll receive a reference number to keep for your records and use when checking your receipt.
            </p>
            <div className="hero-actions">
              <Button asChild>
                <Link href="/apply">Start an application <span aria-hidden="true">→</span></Link>
              </Button>
              <Link className="text-link" href="/apply">Need to start an application?</Link>
            </div>
          </div>
          <div className="hero-image" aria-hidden="true">
            <Image
              src="/hero-phone-mockup.png"
              alt=""
              width={320}
              height={640}
              priority
              sizes="(max-width: 767px) 240px, 320px"
              className="hero-image-img"
            />
          </div>
        </section>

        <section className="service-intro"><div><h2>One clear path from application to review.</h2></div><p>OEC Verify helps applicants submit required information securely for review. Take your time, use accurate details, and save your reference number when you finish.</p></section>
        <section className="trust-strip" aria-label="What to expect">
          <div><strong>01</strong><span>Complete the form</span></div>
          <div><strong>02</strong><span>Receive your reference</span></div>
          <div><strong>03</strong><span>Check your receipt anytime</span></div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
