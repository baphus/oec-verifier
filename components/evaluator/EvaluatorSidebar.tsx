"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Download, LogOut, Menu, X, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { evaluatorLogout } from "@/app/evaluator/actions";
import { ThemeToggle } from "@/components/ThemeToggle";

const navItems = [{ href: "/evaluator", label: "Queue", icon: LayoutDashboard }, { href: "/evaluator/responses", label: "Submissions", icon: FileText }, { href: "/evaluator/export", label: "Export", icon: Download }] as const;

export function EvaluatorSidebar() {
  const pathname = usePathname(); const [open, setOpen] = useState(false);
  const isActive = (href: string) => href === "/evaluator" ? pathname === href : pathname.startsWith(href);
  const content = <><div className="flex items-center justify-between px-5 py-6"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-sm bg-[var(--dmw-blue)] text-white"><ShieldCheck className="h-5 w-5" /></div><div><p className="text-sm font-semibold text-[var(--ink)]">OEC Verify</p><p className="text-xs text-[var(--muted-text)]">Evaluator workspace</p></div></div><div className="flex items-center gap-2"><ThemeToggle /><button className="evaluator-mobile-close" onClick={() => setOpen(false)} aria-label="Close navigation"><X className="h-5 w-5" /></button></div></div><div className="mx-4 border-t border-[var(--line)]" /><nav className="flex-1 px-3 pt-5" aria-label="Evaluator workspace"><ul className="space-y-1">{navItems.map(({ href, label, icon: Icon }) => <li key={href}><Link href={href} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium ${isActive(href) ? "bg-[var(--secondary)] text-[var(--dmw-blue)]" : "text-[var(--muted-text)] hover:bg-[var(--muted)] hover:text-[var(--ink)]"}`} aria-current={isActive(href) ? "page" : undefined}><Icon className="h-4 w-4" />{label}</Link></li>)}</ul></nav><div className="mx-4 border-t border-[var(--line)]" /><div className="px-3 py-4"><form action={evaluatorLogout}><button type="submit" className="flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium text-[var(--muted-text)] hover:bg-[var(--destructive-soft)] hover:text-[var(--destructive)]"><LogOut className="h-4 w-4" />Sign out</button></form></div></>;
  return <><button className="evaluator-mobile-trigger" onClick={() => setOpen(true)} aria-label="Open navigation" aria-expanded={open}><Menu className="h-5 w-5" /></button><aside className={`evaluator-sidebar ${open ? "is-open" : ""}`}>{content}</aside>{open && <button className="evaluator-scrim" onClick={() => setOpen(false)} aria-label="Close navigation" />}</>;
}
