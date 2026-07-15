import Link from "next/link";

export function PublicHeader() {
  return <header className="site-header"><Link href="/" className="brand" aria-label="OEC Verify home"><span className="brand-mark">O</span><span>OEC <em>VERIFY</em></span></Link><nav aria-label="Main navigation"><Link href="/apply">Apply</Link><Link href="/evaluator/login">Evaluator login</Link></nav></header>;
}

export function PublicFooter() {
  return <footer className="site-footer"><span>OEC Verify</span><span>Secure airport application intake</span></footer>;
}

export function PageFrame({ children, eyebrow, title, intro }: { children: React.ReactNode; eyebrow: string; title: string; intro?: string }) {
  return <div className="public-page"><PublicHeader /><main className="page-main"><div className="page-heading"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{intro && <p>{intro}</p>}</div>{children}</main><PublicFooter /></div>;
}
