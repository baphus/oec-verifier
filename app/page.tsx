import Link from "next/link";
import { PublicHeader, PublicFooter } from "@/components/public/Shell";

export default function Home() {
  return (
    <div className="public-page">
      <PublicHeader />
      <main>
        <section className="hero-shell">
          <div className="hero-copy">
            <p className="eyebrow">A DMW online service · secure intake</p>
            <h1>Make your airport application with confidence.</h1>
            <p className="hero-lede">
              Submit your application for airport access in a few clear steps. You’ll receive a reference number to keep for your records and use when checking your receipt.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/apply">Start an application <span aria-hidden="true">→</span></Link>
              <Link className="text-link" href="/apply">Need to start an application?</Link>
            </div>
          </div>
          <div className="route-card" aria-label="Application process">
            <div className="route-card-top"><span>YOUR ROUTE</span><span aria-hidden="true">OEC / 01</span></div>
            <div className="route-line"><span className="route-dot" /><span className="route-track" /><span className="route-dot route-dot-end" /></div>
            <div className="route-stops"><span>APPLICATION</span><span>REVIEW</span></div>
            <p>Keep your reference number handy. It is the fastest way to check your receipt and application status.</p>
          </div>
        </section>
        <section className="service-intro"><div><p className="eyebrow">What this service does</p><h2>One clear path from application to review.</h2></div><p>OEC Verify helps applicants submit required information securely for review. Take your time, use accurate details, and save your reference number when you finish.</p></section>
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
