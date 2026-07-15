import Link from "next/link";
import { PublicHeader, PublicFooter } from "@/components/public/Shell";

export default function Home() {
  return (
    <div className="public-page">
      <PublicHeader />
      <main>
        <section className="hero-shell">
          <div className="hero-copy">
            <p className="eyebrow">Airport operations · secure intake</p>
            <h1>Ready for your next departure?</h1>
            <p className="hero-lede">
              Submit your application for airport access in a few clear steps. We’ll give you a reference number to keep for your records.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/apply">Start an application <span aria-hidden="true">→</span></Link>
              <Link className="button button-quiet" href="/evaluator/login">Evaluator login</Link>
            </div>
          </div>
          <div className="route-card" aria-label="Application process">
            <div className="route-card-top"><span>YOUR ROUTE</span><span aria-hidden="true">OEC / 01</span></div>
            <div className="route-line"><span className="route-dot" /><span className="route-track" /><span className="route-dot route-dot-end" /></div>
            <div className="route-stops"><span>APPLICATION</span><span>REVIEW</span></div>
            <p>Keep your reference number handy. It is the fastest way to check your receipt.</p>
          </div>
        </section>
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
