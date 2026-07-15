"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function NextPendingShortcut({
  nextPendingId,
}: {
  nextPendingId: string | null;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!nextPendingId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        router.push(`/evaluator/submissions/${nextPendingId}`);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [nextPendingId, router]);

  return null;
}
