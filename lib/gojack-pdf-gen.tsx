import "server-only";

import path from "path";
import { readFile } from "fs/promises";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";

export type LegalDocId =
  | "nda"
  | "store_agreement"
  | "driver_agreement"
  | "partnership_agreement";

export type GeneratePdfInput = {
  docId: LegalDocId;

  signer: {
    fullName: string;
    email: string;
    phone?: string;
  };

  // Data URL from canvas: "data:image/png;base64,...."
  signaturePngDataUrl?: string;

  // Optional: override header metadata
  effectiveDate?: string; // e.g. "24 Dec 2025"
};

const GOJACK_CONFIG = {
  companyName: "GoJack Pty Ltd",
  // Replace with real values later
  acn: "ACN 999 999 999",
  abn: "ABN 12 999 999 999",
  addressLine: "Melbourne, Victoria, Australia",
  email: "legal@gojack.com",
  website: "https://gojack.com",

  // Branding
  logoPublicPath: "/public/gojack-logo.png", // resolved using project root
  primaryRgb: rgb(0.06, 0.09, 0.16), // slate-ish
  mutedRgb: rgb(0.35, 0.4, 0.45),
};

const DOC_META: Record<
  LegalDocId,
  { title: string; version: string; mdFile: string }
> = {
  nda: {
    title: "Non-Disclosure Agreement",
    version: "1.0",
    mdFile: "nda.md",
  },
  store_agreement: {
    title: "Store Partner Agreement",
    version: "2.1",
    mdFile: "store_agreement.md",
  },
  driver_agreement: {
    title: "Driver Independent Contractor Agreement",
    version: "1.4",
    mdFile: "driver_agreement.md",
  },
  partnership_agreement: {
    title: "Co-Founder Partnership Agreement",
    version: "1.0",
    mdFile: "partnership_agreement.md",
  },
};

const PAGE = {
  width: 595.28, // A4 points
  height: 841.89, // A4 points
  marginX: 48,
  marginTop: 56,
  marginBottom: 56,
  headerHeight: 72,
  footerHeight: 32,
};

function projectPath(...parts: string[]) {
  return path.join(process.cwd(), ...parts);
}

async function loadMarkdownForDoc(docId: LegalDocId): Promise<string> {
  const meta = DOC_META[docId];
  const mdPath = projectPath("legal-docs", meta.mdFile);

  try {
    return await readFile(mdPath, "utf8");
  } catch {
    // Fallback minimal content to avoid crashing in dev if file missing
    return [
      `# ${meta.title}`,
      ``,
      `**Version:** ${meta.version}`,
      ``,
      `Placeholder content: add the full document at ${mdPath}`,
    ].join("\n");
  }
}

async function loadLogoPngBytes(): Promise<Uint8Array | null> {
  const logoFsPath = projectPath(
    GOJACK_CONFIG.logoPublicPath.replace(/^\/+/, "")
  );
  try {
    const buf = await readFile(logoFsPath);
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) throw new Error("Invalid signature data URL");
  const b64 = match[2];
  return Uint8Array.from(Buffer.from(b64, "base64"));
}

/**
 * Very small/robust markdown -> plain text conversion.
 * (Keeps it predictable and avoids HTML render dependencies.)
 */
function mdToPlainText(md: string): string {
  return (
    md
      // normalize newlines
      .replace(/\r\n/g, "\n")
      // remove code fences (keep inside)
      .replace(/``````/g, (block) => block.replace(/``````/g, ""))
      // remove inline code ticks
      .replace(/`([^`]+)`/g, "$1")
      // headings
      .replace(/^#{1,6}\s+/gm, "")
      // bold/italic
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/__([^_]+)__/g, "$1")
      .replace(/_([^_]+)_/g, "$1")
      // links [text](url) -> text (url)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
      // horizontal rules
      .replace(/^\s*---\s*$/gm, "")
      // collapse too many blank lines
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

function drawHeader(opts: {
  page: PDFPage;
  helvetica: PDFFont;
  helveticaBold: PDFFont;
  title: string;
  version: string;
  effectiveDateText: string;
  logo?: { bytes: Uint8Array; width: number; height: number };
}) {
  const {
    page,
    helvetica,
    helveticaBold,
    title,
    version,
    effectiveDateText,
    logo,
  } = opts;

  const topY = PAGE.height - PAGE.marginTop;
  const leftX = PAGE.marginX;

  // Logo
  if (logo) {
    // Keep it small & left-aligned in header
    page.drawImage(
      (page.doc as any).embedPng ? (null as any) : (null as any),
      {}
    );
    // ^ ignore: we embed images separately; see generate function
  }

  // Company block (right of logo area)
  const companyX = leftX;
  const companyY = topY;

  page.drawText(GOJACK_CONFIG.companyName, {
    x: companyX,
    y: companyY,
    size: 12,
    font: helveticaBold,
    color: GOJACK_CONFIG.primaryRgb,
  });

  page.drawText(`${GOJACK_CONFIG.acn} | ${GOJACK_CONFIG.abn}`, {
    x: companyX,
    y: companyY - 14,
    size: 9,
    font: helvetica,
    color: GOJACK_CONFIG.mutedRgb,
  });

  page.drawText(`${GOJACK_CONFIG.addressLine}`, {
    x: companyX,
    y: companyY - 26,
    size: 9,
    font: helvetica,
    color: GOJACK_CONFIG.mutedRgb,
  });

  page.drawText(`${GOJACK_CONFIG.email} | ${GOJACK_CONFIG.website}`, {
    x: companyX,
    y: companyY - 38,
    size: 9,
    font: helvetica,
    color: GOJACK_CONFIG.mutedRgb,
  });

  // Divider line
  const lineY = PAGE.height - (PAGE.marginTop + PAGE.headerHeight - 12);
  page.drawLine({
    start: { x: PAGE.marginX, y: lineY },
    end: { x: PAGE.width - PAGE.marginX, y: lineY },
    thickness: 1,
    color: rgb(0.85, 0.87, 0.9),
  });

  // Doc title & meta under divider
  page.drawText(title.toUpperCase(), {
    x: PAGE.marginX,
    y: lineY - 24,
    size: 14,
    font: helveticaBold,
    color: GOJACK_CONFIG.primaryRgb,
  });

  page.drawText(`Version ${version} | Effective: ${effectiveDateText}`, {
    x: PAGE.marginX,
    y: lineY - 40,
    size: 9,
    font: helvetica,
    color: GOJACK_CONFIG.mutedRgb,
  });
}

function drawFooter(opts: {
  page: PDFPage;
  helvetica: PDFFont;
  pageNumber: number;
  totalPages: number;
  docId: LegalDocId;
  version: string;
}) {
  const { page, helvetica, pageNumber, totalPages, docId, version } = opts;

  const footerY = PAGE.marginBottom - 20;
  const leftX = PAGE.marginX;

  page.drawText(`GoJack Pty Ltd • ${docId} v${version}`, {
    x: leftX,
    y: footerY,
    size: 8,
    font: helvetica,
    color: GOJACK_CONFIG.mutedRgb,
  });

  const rightText = `Page ${pageNumber} of ${totalPages}`;
  const textWidth = helvetica.widthOfTextAtSize(rightText, 8);

  page.drawText(rightText, {
    x: PAGE.width - PAGE.marginX - textWidth,
    y: footerY,
    size: 8,
    font: helvetica,
    color: GOJACK_CONFIG.mutedRgb,
  });
}

function wrapTextToLines(opts: {
  text: string;
  font: PDFFont;
  fontSize: number;
  maxWidth: number;
}): string[] {
  const { text, font, fontSize, maxWidth } = opts;

  const paragraphs = text.split(/\n\s*\n/);
  const lines: string[] = [];

  for (const para of paragraphs) {
    const raw = para.replace(/\s+/g, " ").trim();
    if (!raw) {
      lines.push("");
      continue;
    }

    const words = raw.split(" ");
    let current = "";

    for (const w of words) {
      const next = current ? `${current} ${w}` : w;
      const width = font.widthOfTextAtSize(next, fontSize);

      if (width <= maxWidth) {
        current = next;
      } else {
        if (current) lines.push(current);
        current = w;
      }
    }

    if (current) lines.push(current);
    lines.push(""); // blank line after paragraph
  }

  // avoid trailing blank spam
  while (lines.length && lines[lines.length - 1] === "") lines.pop();
  return lines;
}

export async function generateSignedLegalPdfBytes(
  input: GeneratePdfInput
): Promise<Uint8Array> {
  const { docId, signer, signaturePngDataUrl, effectiveDate } = input;
  const meta = DOC_META[docId];

  const md = await loadMarkdownForDoc(docId);
  const bodyText = mdToPlainText(md);

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`${meta.title} (GoJack)`);
  pdfDoc.setSubject(meta.title);
  pdfDoc.setCreator(GOJACK_CONFIG.companyName);
  pdfDoc.setProducer("GoJack Legal Portal");

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const logoBytes = await loadLogoPngBytes();
  const embeddedLogo = logoBytes ? await pdfDoc.embedPng(logoBytes) : null;

  const effectiveDateText =
    effectiveDate ||
    new Date().toLocaleDateString("en-AU", { dateStyle: "medium" });

  // Layout
  const contentFontSize = 10;
  const lineHeight = 14;

  const contentTopY = PAGE.height - PAGE.marginTop - PAGE.headerHeight; // below header area
  const contentBottomY = PAGE.marginBottom + PAGE.footerHeight;
  const contentHeight = contentTopY - contentBottomY;

  const contentWidth = PAGE.width - PAGE.marginX * 2;

  // Compose main body lines
  const lines = wrapTextToLines({
    text: bodyText,
    font: helvetica,
    fontSize: contentFontSize,
    maxWidth: contentWidth,
  });

  // Add a signature page section at the end
  const signatureBlock = [
    "",
    "SIGNATURE PAGE",
    "",
    `Signed by: ${signer.fullName}`,
    `Email: ${signer.email}`,
    signer.phone ? `Phone: ${signer.phone}` : "",
    `Signed at: ${new Date().toISOString()}`,
    "",
    "Electronic signature captured digitally. Audit data (timestamp/device/IP) should be stored by the platform.",
  ]
    .filter(Boolean)
    .join("\n");

  const sigLines = wrapTextToLines({
    text: signatureBlock,
    font: helvetica,
    fontSize: contentFontSize,
    maxWidth: contentWidth,
  });

  const allLines = [...lines, "", ...sigLines];

  // Pagination
  const linesPerPage = Math.floor(contentHeight / lineHeight);
  const totalPages = Math.max(1, Math.ceil(allLines.length / linesPerPage));

  // Pre-embed signature image (optional)
  let embeddedSignature: { img: any; width: number; height: number } | null =
    null;

  if (signaturePngDataUrl) {
    const sigBytes = dataUrlToUint8Array(signaturePngDataUrl);
    const sigImg = await pdfDoc.embedPng(sigBytes);
    embeddedSignature = {
      img: sigImg,
      width: sigImg.width,
      height: sigImg.height,
    };
  }

  // Create pages
  const pages: PDFPage[] = [];
  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    const page = pdfDoc.addPage([PAGE.width, PAGE.height]);
    pages.push(page);

    // Header
    drawHeader({
      page,
      helvetica,
      helveticaBold,
      title: meta.title,
      version: meta.version,
      effectiveDateText,
    });

    // draw logo if available (after header text so we don't need hacks)
    if (embeddedLogo) {
      const maxLogoH = 22;
      const scale = maxLogoH / embeddedLogo.height;
      const w = embeddedLogo.width * scale;
      const h = embeddedLogo.height * scale;

      page.drawImage(embeddedLogo, {
        x: PAGE.width - PAGE.marginX - w,
        y: PAGE.height - PAGE.marginTop - 4 - h,
        width: w,
        height: h,
      });
    }

    // Content
    const start = pageIndex * linesPerPage;
    const end = Math.min(allLines.length, start + linesPerPage);
    const slice = allLines.slice(start, end);

    let y = contentTopY - 18; // a little padding under title/meta
    for (const line of slice) {
      if (line === "") {
        y -= lineHeight; // paragraph gap
        continue;
      }

      page.drawText(line, {
        x: PAGE.marginX,
        y,
        size: contentFontSize,
        font: helvetica,
        color: GOJACK_CONFIG.primaryRgb,
      });

      y -= lineHeight;
    }

    // Footer (we'll draw after we know total pages)
  }

  // Draw footer with page count
  pages.forEach((p, idx) => {
    drawFooter({
      page: p,
      helvetica,
      pageNumber: idx + 1,
      totalPages,
      docId,
      version: meta.version,
    });
  });

  // Put signature image near the end (best-effort): draw it on the last page above footer
  if (embeddedSignature) {
    const lastPage = pages[pages.length - 1];

    const targetW = 180; // points
    const scale = targetW / embeddedSignature.width;
    const targetH = embeddedSignature.height * scale;

    const x = PAGE.marginX;
    const y = PAGE.marginBottom + PAGE.footerHeight + 40;

    lastPage.drawImage(embeddedSignature.img, {
      x,
      y,
      width: targetW,
      height: targetH,
    });

    lastPage.drawText("Signature:", {
      x,
      y: y + targetH + 8,
      size: 10,
      font: helveticaBold,
      color: GOJACK_CONFIG.primaryRgb,
    });
  }

  return await pdfDoc.save();
}

/**
 * Convenience helper*/
