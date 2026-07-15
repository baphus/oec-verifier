"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Download, LogOut } from "lucide-react";
import { evaluatorLogout } from "@/app/evaluator/actions";

const navItems = [
  { href: "/evaluator", label: "Overview", icon: LayoutDashboard },
  { href: "/evaluator/responses", label: "Submissions", icon: FileText },
  { href: "/evaluator/export", label: "Export", icon: Download },
] as const;

export function EvaluatorSidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/evaluator") return pathname === "/evaluator";
    return pathname.startsWith(href);
  }

  return (
    <aside className="flex flex-col h-screen w-[260px] min-w-[260px] border-r border-slate-200 bg-white">
      {/* Branding */}
      <div className="px-6 pt-7 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#093CA8]">
            <span className="text-sm font-bold text-white tracking-tight">OV</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 leading-tight">OEC Verify</p>
            <p className="text-xs text-slate-500 leading-tight">Evaluator Portal</p>
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="mx-4 border-t border-slate-100" />

      {/* Navigation */}
      <nav className="flex-1 px-3 pt-4" aria-label="Evaluator workspace">
        <ul className="space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-blue-50 text-[#093CA8] border-l-[3px] border-[#093CA8] pl-[9px]"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-[3px] border-transparent pl-[9px]"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Separator */}
      <div className="mx-4 border-t border-slate-100" />

      {/* Sign out */}
      <div className="px-3 py-4">
        <form action={evaluatorLogout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700 border-l-[3px] border-transparent pl-[9px]"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
