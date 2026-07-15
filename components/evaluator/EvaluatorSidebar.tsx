"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Download,
  LogOut,
  Menu,
  X,
  User,
} from "lucide-react";
import { useState } from "react";
import { evaluatorLogout } from "@/app/evaluator/actions";
import { ThemeToggle } from "@/components/ThemeToggle";
import Image from "next/image";

const navItems = [
  { href: "/evaluator", label: "Dashboard", icon: LayoutDashboard },
  { href: "/evaluator/responses", label: "Submissions", icon: FileText },
  { href: "/evaluator/export", label: "Export", icon: Download },
  { href: "/evaluator/account", label: "Account", icon: User },
] as const;

export function EvaluatorSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) =>
    href === "/evaluator" ? pathname === href : pathname.startsWith(href);

  const content = (
    <>
      <div className="flex items-center justify-between px-5 py-6">
        <Link href="/evaluator" className="flex items-center gap-3 group">
          <Image
            src="/dmw_logo.png"
            alt="Department of Migrant Workers"
            width={32}
            height={32}
            className="rounded-sm shrink-0"
          />
          <div>
            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              DMW Verify
            </p>
            <p className="text-[0.65rem] leading-tight text-muted-foreground">
              Department of Migrant Workers
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            className="evaluator-mobile-close"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="mx-4 border-t border-border" />
      <nav className="flex-1 px-3 pt-5" aria-label="Evaluator workspace">
        <ul className="space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium ${
                  isActive(href)
                    ? "bg-secondary text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                aria-current={isActive(href) ? "page" : undefined}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mx-4 border-t border-border" />
      <div className="px-3 py-4 space-y-2">
        <form action={evaluatorLogout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive-soft hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </div>
    </>
  );

  return (
    <>
      <button
        className="evaluator-mobile-trigger"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        aria-expanded={open}
      >
        <Menu className="h-5 w-5" />
      </button>
      <aside className={`evaluator-sidebar ${open ? "is-open" : ""}`}>
        {content}
      </aside>
      {open && (
        <button
          className="evaluator-scrim"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        />
      )}
    </>
  );
}
