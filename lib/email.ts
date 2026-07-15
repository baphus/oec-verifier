import nodemailer from "nodemailer";
import QRCode from "qrcode";
import { env } from "./env";
import { formatInTimeZone } from "./time";
import { receiptUrl } from "./security";
const htmlEscape = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] ?? char));
export async function sendReceiptEmail(input: { email: string; reference: string; token?: string; expiresAt: string; status?: string; messageId: string; fullName?: string; evaluatorName?: string; decisionReason?: string | null; decidedAt?: string | null; jobsite?: string }) {
  const e = env(); const revoked = input.status === "revoked"; const url = input.token ? receiptUrl(input.token) : "";
  const qr = revoked || !input.token ? null : await QRCode.toBuffer(url, { type: "png", width: 300, margin: 1 });
  const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: e.GMAIL_USER, pass: e.GMAIL_APP_PASSWORD } });
  const decision = input.status === "rejected" ? "Your application was reviewed and rejected." : input.status === "verified" ? "Your application was reviewed and verified." : revoked ? "Your verified receipt has been revoked." : "Your OEC application was received.";
  const revokedText = revoked ? ` Applicant: ${input.fullName ?? "OFW applicant"}. Evaluator: ${input.evaluatorName ?? "OEC evaluator"}. Revoked: ${input.decidedAt ? formatInTimeZone(input.decidedAt) : formatInTimeZone(new Date())}. Reason: ${input.decisionReason ?? "Not provided"}. Please proceed to the airport assistance desk for guidance.` : "";
  const receiptText = url ? ` Receipt: ${url}. Receipt access expires ${formatInTimeZone(input.expiresAt)}.` : "";
  const revokedHtml = revoked ? `<p>Applicant: <strong>${htmlEscape(input.fullName ?? "OFW applicant")}</strong></p><p>Evaluator: ${htmlEscape(input.evaluatorName ?? "OEC evaluator")}</p><p>Revoked: ${htmlEscape(input.decidedAt ? formatInTimeZone(input.decidedAt) : formatInTimeZone(new Date()))}</p><p>Reason: ${htmlEscape(input.decisionReason ?? "Not provided")}</p><p>Please proceed to the airport assistance desk for guidance.</p>` : "";
  const receiptHtml = url ? `<p><a href="${htmlEscape(url)}">Open your receipt</a></p><p>Receipt access expires ${formatInTimeZone(input.expiresAt)}.</p><p><img src="cid:receipt-qr" alt="Receipt QR code" /></p>` : "";
  await transporter.sendMail({ messageId: input.messageId, from: e.GMAIL_USER, to: input.email, subject: revoked ? `OEC receipt revoked ${input.reference}` : `OEC application update ${input.reference}`, text: `${decision} Reference: ${input.reference}.${revokedText}${receiptText}`, html: `<p>${decision}</p><p>Reference: <strong>${htmlEscape(input.reference)}</strong></p>${revokedHtml}${receiptHtml}`, ...(qr ? { attachments: [{ filename: "receipt-qr.png", content: qr, cid: "receipt-qr" }] } : {}) });
}
