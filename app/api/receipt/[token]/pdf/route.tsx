import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getPublicReceipt } from "@/lib/actions/submissions";
import { receiptUrl } from "@/lib/security";
import { ReceiptDocument } from "@/lib/pdf/ReceiptDocument";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const receipt = await getPublicReceipt(token);
  const verifyUrl = receiptUrl(token);

  const pdfBuffer = await renderToBuffer(
    <ReceiptDocument data={{ ...receipt, verifyUrl }} />,
  );

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="oec-receipt-${receipt?.referenceNumber ?? "unknown"}.pdf"`,
    },
  });
}
