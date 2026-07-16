import { Shield, FileCheck } from "lucide-react";
import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { ThemeToggle } from "@/components/ThemeToggle";

export { PublicHeader } from "@/components/public/PublicHeader";

export function PublicFooter() {
  return <footer className="mt-auto w-full footer-bg text-[var(--navy-foreground)]">
    <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-10 sm:gap-10 sm:grid-cols-2 sm:px-5 sm:py-12 lg:grid-cols-3">
      <div className="space-y-3"><p className="text-[0.62rem] font-extrabold tracking-[0.08em] text-[var(--dmw-gold)]">Department of Migrant Workers</p><strong className="block font-[Georgia,serif] text-xl sm:text-2xl">OEC Verify</strong><p className="max-w-[320px] text-sm leading-relaxed text-[var(--navy-muted)]">Secure digital application intake and verification for overseas Filipino workers.</p></div>
      <div className="space-y-3"><h2 className="text-[0.68rem] font-extrabold tracking-[0.08em] text-[var(--dmw-gold)]">Quick links</h2><nav aria-label="Footer navigation" className="grid gap-2.5"><Link href="/apply" className="text-sm hover:underline">Start an Application</Link><span className="text-sm text-[var(--navy-muted)]">Receipt status is accessed through the link issued after submission.</span><Link href="/evaluator/login" className="text-sm hover:underline">Evaluator Access</Link></nav></div>
      <div className="space-y-3"><h2 className="text-[0.68rem] font-extrabold tracking-[0.08em] text-[var(--dmw-gold)]">Information</h2><div className="grid gap-2.5 text-sm text-[var(--navy-muted)]"><div className="flex items-start gap-2"><FileCheck className="mt-0.5 h-4 w-4 shrink-0" /><span>Keep your reference number and receipt link for your records.</span></div><p className="text-[0.78rem] leading-relaxed">Receipt links are time-limited. Contact your evaluator if you need assistance with an expired receipt.</p></div></div>
    </div><div className="border-t border-white/15"><div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-3 px-4 py-4 sm:flex-row sm:px-5"><span className="text-[0.7rem] text-[var(--navy-muted)]">&copy; {new Date().getFullYear()} Department of Migrant Workers · Republic of the Philippines</span><div className="footer-settings"><span className="footer-settings-label">Appearance</span><ThemeToggle /></div><span className="text-[0.7rem] text-[var(--navy-muted)]">OEC Verify — Secure Verification Platform</span></div></div>
  </footer>;
}

export function PageFrame({ children, title, intro }: { children: React.ReactNode; title: string; intro?: string }) {
  return <div className="public-page"><PublicHeader /><main className="page-main"><div className="page-heading"><h1>{title}</h1>{intro && <p>{intro}</p>}</div>{children}</main><PublicFooter /></div>;
}
