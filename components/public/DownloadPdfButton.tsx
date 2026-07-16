"use client";
import { useCallback, useState } from "react";

export default function DownloadPdfButton({ token }: { token: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = useCallback(async () => {
    if (!token || token.length < 20) {
      setError("Invalid receipt link.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/receipt/${encodeURIComponent(token)}/pdf`);
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(body || `Server error ${res.status}`);
      }
      const blob = await res.blob();
      if (blob.size === 0) throw new Error("Empty PDF received.");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "oec-receipt.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  return (
    <div className="download-pdf-wrap">
      <button
        className="print-button"
        onClick={download}
        type="button"
        disabled={loading}
      >
        {loading ? "Generating…" : "Download Receipt"}
      </button>
      {error && <span className="download-pdf-error">{error}</span>}
    </div>
  );
}
