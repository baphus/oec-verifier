import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getPublicReceipt } from "@/lib/actions/submissions";
import PrintButton from "@/components/public/PrintButton";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = { title: "Receipt | OEC Verify", robots: { index: false, follow: false } };

type SafeReceipt = { referenceNumber?: string; state?: "valid" | "expired" | "revoked" | "invalid"; submittedAt?: string; expiresAt?: string; qrCodeDataUrl?: string };

function date(value?: string) { if (!value) return "—"; const parsed = new Date(value); return Number.isNaN(parsed.valueOf()) ? value : parsed.toLocaleDateString("en-US", { dateStyle: "medium" }); }

export default async function ReceiptPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const receipt = (await getPublicReceipt(token)) as SafeReceipt | null;
  const state = receipt?.state?.toUpperCase() ?? "INVALID";
  const knownState = ["VALID", "EXPIRED", "REVOKED"].includes(state) ? state : "INVALID";
  const copy: { title: string; body: string } = {
    VALID: { title: "Receipt is valid", body: "Present this receipt to your airport or facility contact as instructed." },
    EXPIRED: { title: "Receipt has expired", body: "Do not use this receipt for airport access. Contact your evaluator or submit a new application." },
    REVOKED: { title: "Receipt has been revoked", body: "Do not use this receipt for airport access. Contact your evaluator for next steps." },
    INVALID: { title: "Receipt could not be verified", body: "Do not use this receipt for airport access. Check the link or contact your evaluator." },
  }[knownState] ?? { title: "Receipt not found", body: "We could not verify this receipt. Check the link and try again." };
  const qr = knownState === "VALID" ? receipt?.qrCodeDataUrl : undefined;
  return <main className="receipt-page"><div className="receipt-toolbar"><Link className="brand" href="/"><span className="brand-mark">O</span><span>OEC <em>VERIFY</em></span></Link><PrintButton /></div><Card className={`receipt-card receipt-${knownState.toLowerCase()}`}><div className="receipt-status"><Badge variant={knownState === "VALID" ? "default" : "destructive"}>{knownState}</Badge></div><h1>{copy.title}</h1><p className="receipt-body">{copy.body}</p>{knownState === "VALID" && receipt && <><div className="receipt-rule" /><dl className="receipt-details"><div><dt>Reference number</dt><dd>{receipt.referenceNumber || "—"}</dd></div><div><dt>Submitted</dt><dd>{date(receipt.submittedAt)}</dd></div><div><dt>Valid through</dt><dd>{date(receipt.expiresAt)}</dd></div></dl>{qr ? <div className="receipt-qr"><Image src={qr} alt="Receipt verification code" width={130} height={130} unoptimized /></div> : <div className="qr-placeholder">Verification code unavailable</div>}</>}</Card><p className="receipt-note">This page shows limited receipt information. No applicant personal information is displayed.</p><Link className="text-link" href="/">Back to OEC Verify</Link></main>;
}
