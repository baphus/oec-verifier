"use client";

import Link from "next/link";
import Image from "next/image";
import { ExternalLink, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

export function PublicHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--line)] bg-[var(--card)]">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <Link href="/" onClick={() => setOpen(false)} className="inline-flex min-w-0 items-center gap-2.5 text-[var(--dmw-blue)]" aria-label="OEC Verify home">
          <Image src="/dmw_logo.png" alt="Department of Migrant Workers" width={44} height={44} priority className="h-10 w-10 shrink-0 object-contain sm:h-11 sm:w-11" />
          <span className="grid min-w-0 gap-0.5"><span className="truncate text-[0.78rem] font-extrabold tracking-[0.06em] sm:text-sm">OEC <em className="not-italic text-[var(--dmw-crimson)]">Verify</em></span><small className="hidden text-[0.55rem] font-semibold tracking-[0.06em] text-[var(--muted-text)] sm:block">DEPARTMENT OF MIGRANT WORKERS</small></span>
        </Link>
        <div className="flex items-center gap-2"><button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="public-navigation" aria-label={open ? "Close navigation menu" : "Open navigation menu"} className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--muted)] sm:hidden">{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button></div>
        <nav id="public-navigation" aria-label="Main navigation" className={`${open ? "flex" : "hidden"} absolute inset-x-0 top-full flex-col gap-1 border-b border-[var(--line)] bg-[var(--card)] p-3 shadow-md sm:static sm:flex sm:flex-row sm:items-center sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none`}>
          <Link href="/apply" onClick={() => setOpen(false)} className="rounded-sm px-3 py-2.5 text-[0.82rem] font-semibold text-[var(--muted-text)] hover:bg-[var(--muted)] hover:text-[var(--dmw-blue)]">Apply</Link>
          <Link href="/evaluator/login" onClick={() => setOpen(false)} className="inline-flex items-center gap-1.5 rounded-sm border border-[var(--line)] px-3 py-2.5 text-[0.78rem] font-bold text-[var(--ink)] hover:border-[var(--dmw-blue)] hover:text-[var(--dmw-blue)]">Staff Portal <ExternalLink className="h-3 w-3" /></Link>
        </nav>
      </div>
    </header>
  );
}
