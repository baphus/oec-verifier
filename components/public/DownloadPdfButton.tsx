"use client";
import { useCallback } from "react";

export default function DownloadPdfButton({ token }: { token: string }) {
  const download = useCallback(async () => {
    try {
      const res = await fetch(`/api/receipt/${encodeURIComponent(token)}/pdf`);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "oec-receipt.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // silent — nothing actionable for the user
    }
  }, [token]);

  return (
    <button className="print-button" onClick={download} type="button">
      Download Receipt
    </button>
  );
}
