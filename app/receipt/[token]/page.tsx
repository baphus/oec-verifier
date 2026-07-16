import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getPublicReceipt } from "@/lib/actions/submissions";
import { receiptUrl } from "@/lib/security";
import PrintButton from "@/components/public/PrintButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = { title: "Receipt | OEC Verify", robots: { index: false, follow: false } };

type SafeReceipt = {
  referenceNumber?: string;
  state?: "valid" | "expired" | "revoked" | "invalid";
  issuedAt?: string;
  expiresAt?: string;
  fullName?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  suffix?: string;
  oecNumber?: string;
  email?: string;
  gender?: string;
  category?: string;
  philippineAddress?: string;
  province?: string;
  region?: string;
  position?: string;
  jobsite?: string;
  contactNumber?: string;
  departureDate?: string | null;
  details?: string;
  decisionReason?: string | null;
  decidedAt?: string | null;
  submittedAt?: string;
  qrCodeDataUrl?: string;
};

const fmt = (value: string | undefined | null) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
};

const fmtDate = (value: string | undefined | null) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString("en-US", { dateStyle: "medium" });
};

const v = (val: string | undefined | null) =>
  val && val !== "N/A" ? val : "—";

type SectionProps = { heading: string; children: React.ReactNode; show?: boolean };
const Section = ({ heading, children, show = true }: SectionProps) =>
  show ? (
    <div className="receipt-section">
      <div className="receipt-section-header">{heading}</div>
      <dl className="receipt-grid">{children}</dl>
    </div>
  ) : null;

type FieldProps = { label: string; value: string; wide?: boolean; show?: boolean };
const Field = ({ label, value, wide, show = true }: FieldProps) =>
  show ? (
    <div className={`receipt-field${wide ? " receipt-field-full" : ""}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  ) : null;

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const receipt = (await getPublicReceipt(token)) as SafeReceipt | null;

  const state = receipt?.state?.toUpperCase() ?? "INVALID";
  const knownState = ["VALID", "EXPIRED", "REVOKED"].includes(state)
    ? state
    : "INVALID";

  const banner: { title: string; body: string; cssClass: string } = {
    VALID: {
      title: "Receipt is valid",
      body: "Present this receipt to your airport or facility contact as instructed. This receipt can be verified online via the QR code below.",
      cssClass: "receipt-banner-valid",
    },
    EXPIRED: {
      title: "Receipt has expired",
      body: "This receipt is no longer valid for airport access. Contact your evaluator or submit a new application.",
      cssClass: "receipt-banner-expired",
    },
    REVOKED: {
      title: "Receipt has been revoked",
      body: "This receipt is no longer valid for airport access. Contact your evaluator for next steps.",
      cssClass: "receipt-banner-revoked",
    },
    INVALID: {
      title: "Receipt could not be verified",
      body: "This receipt could not be verified. Check the link or contact your evaluator.",
      cssClass: "receipt-banner-invalid",
    },
  }[knownState] ?? {
    title: "Receipt not found",
    body: "We could not verify this receipt. Check the link and try again.",
    cssClass: "receipt-banner-invalid",
  };

  const isLive = knownState === "VALID";
  const qr = isLive && receipt?.qrCodeDataUrl ? receipt.qrCodeDataUrl : null;

  const name = [receipt?.firstName, receipt?.middleName, receipt?.lastName, receipt?.suffix]
    .filter(Boolean)
    .join(" ");

  const now = new Date();
  const printedTimestamp = now.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const receiptUrlStr = receiptUrl(token);

  return (
    <main className="receipt-page">
      {/* ── screen toolbar ─────────────────────────────────── */}
      <div className="receipt-toolbar">
        <Link className="brand" href="/">
          <Image
            className="brand-logo"
            src="/dmw_logo.png"
            alt="DMW"
            width={38}
            height={38}
          />
          <span className="brand-copy">
            OEC <em>VERIFY</em>
            <small>SECURE APPLICATION INTAKE</small>
          </span>
        </Link>
        <PrintButton />
      </div>

      {/* ── receipt card ─────────────────────────────────── */}
      <div className={`receipt-card receipt-${knownState.toLowerCase()}`}>

        {/* print-only: DMW official header */}
        <div className="print-only-header">
          <Image
            className="print-only-logo"
            src="/dmw_logo.png"
            alt="DMW"
            width={48}
            height={48}
          />
          <div className="print-only-header-text">
            <span className="print-only-republic">Republic of the Philippines</span>
            <span className="print-only-dept">Department of Migrant Workers</span>
            <span className="print-only-system">OEC VERIFY</span>
          </div>
        </div>

        {/* print-only: Official receipt title */}
        <h1 className="print-only-title">OFFICIAL OEC RECEIPT</h1>

        {/* print-only: reference number line */}
        <p className="print-only-ref">
          Reference: <strong>{v(receipt?.referenceNumber)}</strong>
        </p>

        {/* print-only: status line */}
        <div className={`print-only-status print-only-status-${knownState.toLowerCase()}`}>
          STATUS: {knownState}
        </div>

        <hr className="receipt-rule print-only-rule" />

        {/* screen-only: status banner (hidden in print) */}
        <div className={`receipt-banner ${banner.cssClass}`}>
          <strong>{banner.title}</strong>
          {banner.body}
        </div>

        {/* screen heading */}
        <h1 className="screen-only">OEC Application Receipt</h1>
        <p className="receipt-body screen-only">
          Department of Migrant Workers &bull; Overseas Employment Certificate
        </p>

        <hr className="receipt-rule screen-only" />

        {/* ── receipt info ──────────────────────────────── */}
        <Section heading="Receipt Information">
          <Field label="Reference No." value={v(receipt?.referenceNumber)} />
          <Field label="Date Issued" value={fmt(receipt?.issuedAt)} />
          <Field label="Valid Through" value={fmt(receipt?.expiresAt)} />
          <Field label="Status" value={knownState} />
        </Section>

        {/* ── applicant info ────────────────────────────── */}
        <Section heading="Applicant Information" show={!!receipt}>
          <Field
            label="Full Name"
            value={
              receipt?.fullName && receipt.fullName !== "N/A"
                ? receipt.fullName
                : name || "—"
            }
            wide
          />
          <Field label="OEC Number" value={v(receipt?.oecNumber)} />
          <Field label="Email" value={v(receipt?.email)} />
          <Field label="Contact No." value={v(receipt?.contactNumber)} />
          <Field label="Gender" value={v(receipt?.gender)} />
          <Field label="Category" value={v(receipt?.category)} />
          <Field label="Position" value={v(receipt?.position)} />
          <Field label="Jobsite" value={v(receipt?.jobsite)} />
          <Field
            label="Philippine Address"
            value={v(receipt?.philippineAddress)}
            wide
          />
          <Field label="Province" value={v(receipt?.province)} />
          <Field label="Region" value={v(receipt?.region)} />
          <Field
            label="Departure Date"
            value={fmtDate(receipt?.departureDate)}
          />
          <Field
            label="Submitted At"
            value={fmt(receipt?.submittedAt)}
          />
        </Section>

        {/* ── decision details ──────────────────────────── */}
        <Section
          heading="Decision Details"
          show={!!receipt?.decidedAt || !!receipt?.decisionReason}
        >
          <Field
            label="Decision Date"
            value={fmt(receipt?.decidedAt)}
            show={!!receipt?.decidedAt}
          />
          <Field
            label="Reason"
            value={v(receipt?.decisionReason)}
            show={!!receipt?.decisionReason}
          />
          {knownState === "REVOKED" && (
            <Field
              label="Next Steps"
              value="Proceed to the airport assistance desk for guidance."
              wide
            />
          )}
          {knownState === "REJECTED" && (
            <Field
              label="Next Steps"
              value="Contact your evaluator or visit the airport assistance desk if you believe this is an error."
              wide
            />
          )}
        </Section>

        {/* ── QR code ───────────────────────────────────── */}
        {isLive && qr && (
          <div className="receipt-qr-section">
            <Image
              src={qr}
              alt="Receipt QR code"
              width={130}
              height={130}
              unoptimized
            />
            <span className="receipt-qr-label">
              Scan to verify this receipt
            </span>
            <a className="receipt-verify-link" href={receiptUrlStr}>
              {receiptUrlStr}
            </a>
          </div>
        )}

        {/* print-only: verification line */}
        <div className="print-only-verify-line">
          Verification: Scan the QR code above or visit{" "}
          <strong>{receiptUrlStr}</strong>
        </div>

        {/* ── footer ─────────────────────────────────────── */}
        <div className="receipt-footer-text">
          This official receipt is issued by the Department of Migrant Workers.
          <br />
          Verification is available via QR code scan or at the DMW website.
        </div>

        {/* print-only: official footer */}
        <div className="print-only-footer">
          <div className="print-only-footer-dept">
            Department of Migrant Workers
          </div>
          <div className="print-only-footer-address">
            Blas F. Ople Building, Ortigas Avenue Corner Meralco Avenue,
            Pasig City, Metro Manila, Philippines
          </div>
          <div className="print-only-footer-contact">
            Tel: (02) 8721-0140 &nbsp;|&nbsp; Website: www.dmw.gov.ph
          </div>
          <div className="print-only-printed-on">
            Printed on: {printedTimestamp}
          </div>
        </div>

        {/* print-only: watermark */}
        <div className="print-only-watermark" aria-hidden="true">
          OFFICIAL RECEIPT
        </div>
      </div>

      <p className="receipt-note">
        Keep this receipt for your records. Present it when instructed by airport
        or facility personnel.
      </p>
      <Link className="text-link" href="/">
        Back to OEC Verify
      </Link>
    </main>
  );
}
