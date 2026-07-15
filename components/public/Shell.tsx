import Link from "next/link";
import Image from "next/image";
import { Shield, FileCheck, ExternalLink } from "lucide-react";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--line)] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-4">
        <Link
          href="/"
          className="inline-flex items-center gap-3 text-[var(--dmw-blue)] no-underline"
          aria-label="OEC Verify home"
        >
          <Image
            src="/dmw_logo.png"
            alt="Department of Migrant Workers"
            width={44}
            height={44}
            priority
            className="h-11 w-11 object-contain"
          />
          <span className="grid gap-0.5">
            <span className="text-xs font-extrabold tracking-[0.12em]">
              OEC <em className="not-italic text-[var(--dmw-crimson)]">VERIFY</em>
            </span>
            <small className="text-[0.58rem] font-semibold tracking-[0.08em] text-[var(--muted-text)]">
              DEPARTMENT OF MIGRANT WORKERS
            </small>
          </span>
        </Link>

        <nav aria-label="Main navigation" className="flex items-center gap-6">
          <Link
            href="/apply"
            className="text-[0.82rem] font-semibold text-[var(--muted-text)] transition-colors hover:text-[var(--dmw-blue)]"
          >
            Apply
          </Link>
          <Link
            href="/receipt"
            className="text-[0.82rem] font-semibold text-[var(--muted-text)] transition-colors hover:text-[var(--dmw-blue)]"
          >
            Check Receipt
          </Link>
          <Link
            href="/evaluator/login"
            className="inline-flex items-center gap-1.5 rounded border border-[var(--line)] px-3 py-1.5 text-[0.78rem] font-bold text-[var(--ink)] transition-colors hover:border-[var(--dmw-blue)] hover:text-[var(--dmw-blue)]"
          >
            Staff Portal
            <ExternalLink className="h-3 w-3" />
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="mt-auto w-full bg-[linear-gradient(90deg,#071b38eb,#071b38e8),url('/footer.jpg')] bg-cover bg-center text-[#dce7f3]">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-3">
        {/* Branding column */}
        <div className="space-y-3">
          <p className="text-[0.62rem] font-extrabold uppercase tracking-[0.12em] text-[#f3ce58]">
            Department of Migrant Workers
          </p>
          <strong className="block font-[Georgia,serif] text-2xl text-white">
            OEC Verify
          </strong>
          <p className="max-w-[320px] text-sm leading-relaxed text-[#b6c7d9]">
            Secure digital application intake and verification for overseas Filipino workers.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <Shield className="h-4 w-4 text-[#f3ce58]" />
            <span className="text-[0.7rem] font-semibold text-[#b6c7d9]">
              Official Government Service
            </span>
          </div>
        </div>

        {/* Quick links column */}
        <div className="space-y-3">
          <h4 className="text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-[#f3ce58]">
            Quick Links
          </h4>
          <nav aria-label="Footer navigation" className="grid gap-2.5">
            <Link
              href="/apply"
              className="text-sm text-white transition-colors hover:underline"
            >
              Start an Application
            </Link>
            <Link
              href="/receipt"
              className="text-sm text-white transition-colors hover:underline"
            >
              Check Receipt Status
            </Link>
            <Link
              href="/evaluator/login"
              className="text-sm text-white transition-colors hover:underline"
            >
              Evaluator Access
            </Link>
          </nav>
        </div>

        {/* Contact/legal column */}
        <div className="space-y-3">
          <h4 className="text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-[#f3ce58]">
            Information
          </h4>
          <div className="grid gap-2.5 text-sm text-[#b6c7d9]">
            <div className="flex items-start gap-2">
              <FileCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#b6c7d9]" />
              <span>Keep your reference number and receipt link for your records.</span>
            </div>
            <p className="text-[0.78rem] leading-relaxed">
              Receipt links are time-limited. Contact your evaluator if you need assistance with an expired receipt.
            </p>
          </div>
        </div>
      </div>

      {/* Copyright bar */}
      <div className="border-t border-white/20">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-2 px-5 py-4 text-[0.7rem] text-[#b6c7d9] sm:flex-row">
          <span>&copy; {new Date().getFullYear()} Department of Migrant Workers &middot; Republic of the Philippines</span>
          <span>OEC Verify &mdash; Secure Verification Platform</span>
        </div>
      </div>
    </footer>
  );
}

export function PageFrame({ children, eyebrow, title, intro }: { children: React.ReactNode; eyebrow: string; title: string; intro?: string }) {
  return (
    <div className="public-page">
      <PublicHeader />
      <main className="page-main">
        <div className="page-heading">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          {intro && <p>{intro}</p>}
        </div>
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
