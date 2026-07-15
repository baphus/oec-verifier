"use client";

import { Info } from "lucide-react";

const descriptions: Record<string, string> = {
  pending: "Awaiting review by an evaluator.",
  verified: "OEC receipt has been issued.",
  rejected: "Submission did not meet requirements.",
  revoked: "Previously verified receipt has been revoked.",
};

export function StatusHelp({ status }: { status: string }) {
  const text = descriptions[status];
  if (!text) return null;

  return (
    <span
      tabIndex={0}
      role="img"
      aria-label={`Status: ${status}. ${text}`}
      title={`${status.charAt(0).toUpperCase() + status.slice(1)} — ${text}`}
      className="relative inline-flex items-center group/status cursor-help"
    >
      <Info className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-muted-foreground transition-colors" />
      {/* Visual tooltip on hover/focus */}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-md bg-popover text-popover-foreground text-xs leading-snug shadow-md border border-border opacity-0 group-hover/status:opacity-100 group-focus/status:opacity-100 transition-opacity whitespace-nowrap z-50"
      >
        {text}
        <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-popover" />
      </span>
    </span>
  );
}
