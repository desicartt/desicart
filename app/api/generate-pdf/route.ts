import { NextResponse } from "next/server";
import type { LegalDocId } from "@/lib/gojack-pdf-gen";
import { generateSignedLegalPdfBytes } from "@/lib/gojack-pdf-gen";

export const runtime = "nodejs";

type Body = {
  docId: LegalDocId;
  signerName: string;
  signerEmail: string;
  signerPhone?: string;
  signatureImage?: string;
  effectiveDate?: string;
};

export async function POST(req: Request) {
  const body = (await req.json()) as Body;

  if (!body?.docId || !body?.signerName || !body?.signerEmail) {
    return NextResponse.json(
      { error: "Missing docId, signerName or signerEmail" },
      { status: 400 }
    );
  }

  const pdfBytes = await generateSignedLegalPdfBytes({
    docId: body.docId,
    signer: {
      fullName: body.signerName,
      email: body.signerEmail,
      phone: body.signerPhone,
    },
    signaturePngDataUrl: body.signatureImage,
    effectiveDate: body.effectiveDate,
  });

  const filenameSafe = body.signerName
    .replace(/[^a-z0-9-_]+/gi, "-")
    .slice(0, 60);

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="GoJack-${body.docId}-${filenameSafe}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
