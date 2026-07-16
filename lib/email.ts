import nodemailer from "nodemailer";
import QRCode from "qrcode";
import { env } from "./env";
import { formatInTimeZone } from "./time";
import { receiptUrl } from "./security";

const h = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        char
      ] ?? char),
  );

const dt = (value: string | Date | undefined | null) =>
  value ? formatInTimeZone(value) : "—";

function statusLabel(status?: string) {
  switch (status) {
    case "verified": return "Verified";
    case "rejected": return "Rejected";
    case "revoked": return "Revoked";
    default: return "Pending";
  }
}

function statusColor(status?: string) {
  switch (status) {
    case "verified": return "#16a34a";
    case "rejected": return "#dc2626";
    case "revoked": return "#9333ea";
    default: return "#ca8a04";
  }
}

function statusBg(status?: string) {
  switch (status) {
    case "verified": return "#dcfce7";
    case "rejected": return "#fef2f2";
    case "revoked": return "#faf5ff";
    default: return "#fefce8";
  }
}

function headingText(status?: string, revoked?: boolean) {
  if (revoked) return "Your verified receipt has been revoked";
  if (status === "rejected") return "Your application was reviewed and rejected";
  if (status === "verified") return "Your application was reviewed and verified";
  return "Your OEC application was received";
}

function bodyText(status?: string, revoked?: boolean) {
  if (revoked) return "A previously verified OEC receipt has been revoked by an evaluator. This receipt is no longer valid for airport access.";
  if (status === "rejected") return "An evaluator has reviewed your application and it was not approved. If you believe this is an error, please contact your evaluator or visit the airport assistance desk.";
  if (status === "verified") return "Your OEC application has been reviewed and verified by an evaluator. Your official receipt is attached below. Present this to airport personnel as instructed.";
  return "Your Overseas Employment Certificate (OEC) application has been submitted successfully. Please wait for an evaluator to review your application. You will receive another email once a decision has been made.";
}

// ── helpers ──────────────────────────────────────────────────────────────────
const row = (label: string, value: string) =>
  `<tr>
    <td style="padding:6px 0;border-bottom:1px solid #e5e7eb;font-size:14px;line-height:1.5;color:#6b7280;width:140px;vertical-align:top">${h(label)}</td>
    <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;line-height:1.5;color:#111827;font-weight:500">${value}</td>
  </tr>`;

const sectionHeader = (title: string) =>
  `<tr><td colspan="2" style="padding:20px 0 8px 0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#374151;border-bottom:2px solid #374151">${h(title)}</td></tr>`;

// ── main ─────────────────────────────────────────────────────────────────────
export async function sendReceiptEmail(input: {
  email: string;
  reference: string;
  token?: string;
  expiresAt: string;
  status?: string;
  messageId: string;
  fullName?: string;
  evaluatorName?: string;
  decisionReason?: string | null;
  decidedAt?: string | null;
  jobsite?: string;
  // rich receipt fields
  oecNumber?: string;
  issuedAt?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  suffix?: string;
  position?: string;
  gender?: string;
  category?: string;
  philippineAddress?: string;
  province?: string;
  region?: string;
  contactNumber?: string;
  departureDate?: string;
  details?: string;
  submittedAt?: string;
}) {
  const e = env();
  const isRevoked = input.status === "revoked";
  const url = input.token ? receiptUrl(input.token) : "";
  const qr =
    isRevoked || !input.token
      ? null
      : await QRCode.toBuffer(url, { type: "png", width: 300, margin: 1 });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: e.GMAIL_USER, pass: e.GMAIL_APP_PASSWORD },
  });

  // ── status banner ──────────────────────────────────────────────────────────
  const label = statusLabel(input.status);
  const color = statusColor(input.status);
  const bg = statusBg(input.status);

  // ── helper to format a value or fallback ───────────────────────────────────
  const v = (val: string | undefined | null) =>
    val && val !== "N/A" ? h(val) : '<span style="color:#9ca3af">—</span>';

  // ── build details table ────────────────────────────────────────────────────
  let rows = "";

  // Receipt section
  rows += sectionHeader("Receipt Information");
  rows += row("Reference No.", h(input.reference));
  rows += row("Date Issued", dt(input.issuedAt));
  rows += row("Valid Through", dt(input.expiresAt));
  rows += row("Status", `<span style="color:${color};font-weight:600">${label}</span>`);

  // Applicant section
  rows += sectionHeader("Applicant Information");
  rows += row("Full Name", h(input.fullName ?? ""));
  if (input.oecNumber) rows += row("OEC Number", h(input.oecNumber));
  if (input.gender) rows += row("Gender", v(input.gender));
  if (input.category) rows += row("Category", v(input.category));
  if (input.contactNumber) rows += row("Contact No.", h(input.contactNumber));
  if (input.position) rows += row("Position", v(input.position));
  if (input.jobsite) rows += row("Jobsite", v(input.jobsite));
  if (input.philippineAddress) rows += row("Address", v(input.philippineAddress));
  if (input.province) rows += row("Province", v(input.province));
  if (input.region) rows += row("Region", v(input.region));
  if (input.departureDate) rows += row("Departure Date", dt(input.departureDate));

  // Decision section
  if (input.decidedAt || input.decisionReason || input.evaluatorName) {
    rows += sectionHeader("Decision Details");
    if (input.evaluatorName) rows += row("Evaluator", h(input.evaluatorName));
    if (input.decidedAt) rows += row("Decision Date", dt(input.decidedAt));
    if (input.decisionReason)
      rows += row("Reason", h(input.decisionReason));
    if (isRevoked)
      rows += row("Next Steps", "Please proceed to the airport assistance desk for guidance.");
  }

  // Submitted date
  rows += sectionHeader("Submission");
  rows += row("Submitted At", dt(input.submittedAt));

  // ── QR code HTML ───────────────────────────────────────────────────────────
  const qrSection = url
    ? `<table border="0" cellpadding="0" cellspacing="0" style="margin:24px auto 0 auto">
        <tr>
          <td style="text-align:center;padding:16px;border:1px solid #e5e7eb;border-radius:8px;background:#ffffff">
            <img src="cid:receipt-qr" alt="Receipt QR Code" width="130" height="130" style="display:block;margin:0 auto 8px auto" />
            <p style="margin:0;font-size:12px;color:#6b7280">Scan to verify your receipt</p>
            <p style="margin:4px 0 0 0;font-size:12px"><a href="${h(url)}" style="color:#2563eb;text-decoration:underline;word-break:break-all">${h(url)}</a></p>
          </td>
        </tr>
      </table>`
    : "";

  // ── subject line ───────────────────────────────────────────────────────────
  const subject = isRevoked
    ? `OEC Receipt Revoked — ${input.reference}`
    : input.status === "verified"
      ? `OEC Receipt Verified — ${input.reference}`
      : input.status === "rejected"
        ? `OEC Application Update — ${input.reference}`
        : `OEC Application Received — ${input.reference}`;

  // ── plain text fallback ────────────────────────────────────────────────────
  const text = [
    headingText(input.status, isRevoked),
    "",
    `Reference: ${input.reference}`,
    `Date Issued: ${dt(input.issuedAt)}`,
    `Valid Through: ${dt(input.expiresAt)}`,
    `Status: ${label}`,
    "",
    `Applicant: ${input.fullName ?? ""}`,
    input.oecNumber ? `OEC Number: ${input.oecNumber}` : null,
    input.gender ? `Gender: ${input.gender}` : null,
    input.category ? `Category: ${input.category}` : null,
    input.contactNumber ? `Contact: ${input.contactNumber}` : null,
    input.position ? `Position: ${input.position}` : null,
    input.jobsite ? `Jobsite: ${input.jobsite}` : null,
    input.philippineAddress ? `Address: ${input.philippineAddress}` : null,
    input.province ? `Province: ${input.province}` : null,
    input.region ? `Region: ${input.region}` : null,
    input.departureDate ? `Departure Date: ${dt(input.departureDate)}` : null,
    "",
    input.evaluatorName ? `Evaluator: ${input.evaluatorName}` : null,
    input.decidedAt ? `Decision Date: ${dt(input.decidedAt)}` : null,
    input.decisionReason ? `Reason: ${input.decisionReason}` : null,
    isRevoked ? "Next Steps: Please proceed to the airport assistance desk for guidance." : null,
    "",
    `Submitted At: ${dt(input.submittedAt)}`,
    "",
    url ? `View your receipt online: ${url}` : null,
    url ? `Receipt access expires: ${dt(input.expiresAt)}` : null,
    "",
    "— OEC Verify, Department of Migrant Workers",
  ]
    .filter(Boolean)
    .join("\n");

  // ── HTML template ──────────────────────────────────────────────────────────
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f3f4f6;min-width:100%">
    <tr>
      <td align="center" style="padding:24px 16px">
        <!--[if mso]><table border="0" cellpadding="0" cellspacing="0" width="600"><tr><td><![endif]-->
        <table border="0" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">

          <!-- ── header ───────────────────────────────────────────────────── -->
          <tr>
            <td style="background-color:#1e3a5f;padding:24px 32px">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="font-size:20px;font-weight:700;color:#ffffff">OEC <span style="color:#60a5fa">VERIFY</span></td>
                  <td style="text-align:right;font-size:12px;color:#93c5fd">SECURE APPLICATION INTAKE</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── status banner ────────────────────────────────────────────── -->
          <tr>
            <td style="padding:24px 32px 0 32px">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:${bg};border-radius:6px;border-left:4px solid ${color}">
                <tr>
                  <td style="padding:14px 20px">
                    <p style="margin:0 0 4px 0;font-size:16px;font-weight:700;color:#111827">${h(headingText(input.status, isRevoked))}</p>
                    <p style="margin:0;font-size:14px;color:#4b5563;line-height:1.5">${h(bodyText(input.status, isRevoked))}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── details table ────────────────────────────────────────────── -->
          <tr>
            <td style="padding:16px 32px 24px 32px">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse">
                ${rows}
              </table>
            </td>
          </tr>

          <!-- ── QR code ──────────────────────────────────────────────────── -->
          ${url ? `<tr><td style="padding:0 32px 24px 32px">${qrSection}</td></tr>` : ""}

          <!-- ── footer ───────────────────────────────────────────────────── -->
          <tr>
            <td style="background-color:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px">
              <p style="margin:0 0 8px 0;font-size:12px;color:#6b7280;line-height:1.5">
                This is an automated message from the OEC Verify system. Please do not reply directly to this email.
                If you have questions, contact your evaluator or visit the DMW office.
              </p>
              <p style="margin:0;font-size:11px;color:#9ca3af">
                OEC Verify &bull; Department of Migrant Workers &bull; Republic of the Philippines
              </p>
            </td>
          </tr>
        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    messageId: input.messageId,
    from: e.GMAIL_USER,
    to: input.email,
    subject,
    text,
    html,
    ...(qr
      ? { attachments: [{ filename: "receipt-qr.png", content: qr, cid: "receipt-qr" }] }
      : {}),
  });
}
