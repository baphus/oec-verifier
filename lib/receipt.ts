import { receiptState } from "./security";
export function getReceiptPresentationState(receipt: { status?: string; expiresAt?: string }) {
  return receiptState(receipt.status ?? "invalid", receipt.expiresAt ?? new Date(0));
}
