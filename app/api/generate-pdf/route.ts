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

  // Canvas signature data URL: "data:image/png;base64,...."
  signaturePngDataUrl?: string;

  effectiveDate?: string; // e.g. "24 Dec 2025"
};

const GOJACK_CONFIG = {
  companyName: "GoJack Pty Ltd",
  acn: "ACN 999 999 999",
  abn: "ABN 12 999 999 999",
  addressLine: "Melbourne, Victoria, Australia",
  email: "legal@gojack.com",
  website: "https://gojack.com",

  // Put your logo at: /public/gojack-logo.png
  logoFsPath: path.join(process.cwd(), "public", "gojack-logo.png"),

  // Colors
  primary: rgb(0.06, 0.09, 0.16),
  muted: rgb(0.35, 0.4, 0.45),
  line: rgb(0.85, 0.87, 0.9),
};

const DOC_META: Record<
  LegalDocId,
  { title: string; version: string; mdFile: string }
> = {
  nda: { title: "Non-Disclosure Agreement", version: "1.0", mdFile: "nda.md" },
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
  width: 595.28, // A4 in points
  height: 841.89,
  marginX: 48,
  marginTop: 56,
  marginBottom: 56,
  headerHeight: 74,
  footerHeight: 28,
};

function legalDocsPath(filename: string) {
  return path.join(process.cwd(), "legal-docs", filename);
}

async function loadMarkdown(docId: LegalDocId): Promise<string> {
  const meta = DOC_META[docId];
  try {
    return await readFile(legalDocsPath(meta.mdFile), "utf8");
  } catch {
    return `# ${meta.title}\n\n**Version:** ${meta.version}\n\nMissing file: legal-docs/${meta.mdFile}\n`;
  }
}

async function loadLogoBytes(): Promise<Uint8Array | null> {
  try {
    const buf = await readFile(GOJACK_CONFIG.logoFsPath);
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) throw new Error("Invalid signature data URL");
  return Uint8Array.from(Buffer.from(match[2], "base64"));
}

/**
 * Simple markdown -> plain text.
 * Keeps output deterministic without HTML rendering dependencies.
 */
function mdToPlainText(md: string): string {
  return (
    md
      .replace(/\r\n/g, "\n")
      // code fences -> keep inside, remove fences
      .replace(/``````/g, (block) => block.replace(/``````/g, ""))
      // inline code
      .replace(/`([^`]+)`/g, "$1")
      // headings
      .replace(/^#{1,6}\s+/gm, "")
      // bold/italic
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/__([^_]+)__/g, "$1")
      .replace(/_([^_]+)_/g, "$1")
      // links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
      // horizontal rules
      .replace(/^\s*---\s*$/gm, "")
      // normalize whitespace
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

function wrapText(opts: {
  text: string;
  font: PDFFont;
  fontSize: number;
  maxWidth: number;
}): string[] {
  const { text, font, fontSize, maxWidth } = opts;

  const paras = text.split(/\n\s*\n/);
  const out: string[] = [];

  for (const para of paras) {
    const p = para.replace(/\s+/g, " ").trim();
    if (!p) {
      out.push("");
      continue;
    }

    const words = p.split(" ");
    let line = "";

    for (const w of words) {
      const candidate = line ? `${line} ${w}` : w;
      const width = font.widthOfTextAtSize(candidate, fontSize);

      if (width <= maxWidth) {
        line = candidate;
      } else {
        if (line) out.push(line);
        line = w;
      }
    }

    if (line) out.push(line);
    out.push("");
  }

  while (out.length && out[out.length - 1] === "") out.pop();
  return out;
}

function drawHeader(opts: {
  page: PDFPage;
  font: PDFFont;
  fontBold: PDFFont;
  title: string;
  version: string;
  effectiveDateText: string;
  logo?: { image: any; width: number; height: number } | null;
}) {
  const { page, font, fontBold, title, version, effectiveDateText, logo } =
    opts;

  const topY = PAGE.height - PAGE.marginTop;

  // Company block (left)
  page.drawText(GOJACK_CONFIG.companyName, {
    x: PAGE.marginX,
    y: topY,
    size: 12,
    font: fontBold,
    color: GOJACK_CONFIG.primary,
  });

  page.drawText(`${GOJACK_CONFIG.acn} | ${GOJACK_CONFIG.abn}`, {
    x: PAGE.marginX,
    y: topY - 14,
    size: 9,
    font,
    color: GOJACK_CONFIG.muted,
  });

  page.drawText(GOJACK_CONFIG.addressLine, {
    x: PAGE.marginX,
    y: topY - 26,
    size: 9,
    font,
    color: GOJACK_CONFIG.muted,
  });

  page.drawText(`${GOJACK_CONFIG.email} | ${GOJACK_CONFIG.website}`, {
    x: PAGE.marginX,
    y: topY - 38,
    size: 9,
    font,
    color: GOJACK_CONFIG.muted,
  });

  // Logo (right)
  if (logo) {
    const maxH = 22;
    const scale = maxH / logo.height;
    const w = logo.width * scale;
    const h = logo.height * scale;

    page.drawImage(logo.image, {
      x: PAGE.width - PAGE.marginX - w,
      y: topY - 6 - h,
      width: w,
      height: h,
    });
  }

  // Divider
  const dividerY = PAGE.height - (PAGE.marginTop + PAGE.headerHeight - 12);
  page.drawLine({
    start: { x: PAGE.marginX, y: dividerY },
    end: { x: PAGE.width - PAGE.marginX, y: dividerY },
    thickness: 1,
    color: GOJACK_CONFIG.line,
  });

  // Title & meta
  page.drawText(title.toUpperCase(), {
    x: PAGE.marginX,
    y: dividerY - 24,
    size: 14,
    font: fontBold,
    color: GOJACK_CONFIG.primary,
  });

  page.drawText(`Version ${version} | Effective: ${effectiveDateText}`, {
    x: PAGE.marginX,
    y: dividerY - 40,
    size: 9,
    font,
    color: GOJACK_CONFIG.muted,
  });
}

function drawFooter(opts: {
  page: PDFPage;
  font: PDFFont;
  pageNumber: number;
  totalPages: number;
  docId: LegalDocId;
  version: string;
}) {
  const { page, font, pageNumber, totalPages, docId, version } = opts;

  const y = PAGE.marginBottom - 18;

  page.drawText(`GoJack Pty Ltd • ${docId} v${version}`, {
    x: PAGE.marginX,
    y,
    size: 8,
    font,
    color: GOJACK_CONFIG.muted,
  });

  const right = `Page ${pageNumber} of ${totalPages}`;
  const w = font.widthOfTextAtSize(right, 8);

  page.drawText(right, {
    x: PAGE.width - PAGE.marginX - w,
    y,
    size: 8,
    font,
    color: GOJACK_CONFIG.muted,
  });
}

export async function generateSignedLegalPdfBytes(
  input: GeneratePdfInput
): Promise<Uint8Array> {
  const meta = DOC_META[input.docId];
  const md = await loadMarkdown(input.docId);
  const bodyText = mdToPlainText(md);

  const pdf = await PDFDocument.create();
  pdf.setTitle(`${meta.title} (GoJack)`);
  pdf.setCreator(GOJACK_CONFIG.companyName);
  pdf.setProducer("GoJack Legal Portal");

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // Optional logo
  const logoBytes = await loadLogoBytes();
  const embeddedLogo = logoBytes ? await pdf.embedPng(logoBytes) : null;

  // Optional signature
  const signatureBytes = input.signaturePngDataUrl
    ? dataUrlToBytes(input.signaturePngDataUrl)
    : null;
  const embeddedSignature = signatureBytes
    ? await pdf.embedPng(signatureBytes)
    : null;

  const effectiveDateText =
    input.effectiveDate ||
    new Date().toLocaleDateString("en-AU", { dateStyle: "medium" });

  // Content layout
  const contentFontSize = 10;
  const lineHeight = 14;

  const contentTopY = PAGE.height - PAGE.marginTop - PAGE.headerHeight;
  const contentBottomY = PAGE.marginBottom + PAGE.footerHeight;
  const contentHeight = contentTopY - contentBottomY;
  const contentWidth = PAGE.width - PAGE.marginX * 2;

  const lines = wrapText({
    text: bodyText,
    font,
    fontSize: contentFontSize,
    maxWidth: contentWidth,
  });

  // Append signature block text at end
  const signatureBlock = [
    "",
    "SIGNATURE PAGE",
    "",
    `Signed by: ${input.signer.fullName}`,
    `Email: ${input.signer.email}`,
    input.signer.phone ? `Phone: ${input.signer.phone}` : "",
    `Signed at: ${new Date().toISOString()}`,
    "",
    "Electronic signature captured digitally.",
  ]
    .filter(Boolean)
    .join("\n");

  const signatureLines = wrapText({
    text: signatureBlock,
    font,
    fontSize: contentFontSize,
    maxWidth: contentWidth,
  });

  const allLines = [...lines, "", ...signatureLines];

  const linesPerPage = Math.max(1, Math.floor(contentHeight / lineHeight));
  const totalPages = Math.max(1, Math.ceil(allLines.length / linesPerPage));

  const pages: PDFPage[] = [];

  for (let i = 0; i < totalPages; i++) {
    const page = pdf.addPage([PAGE.width, PAGE.height]);
    pages.push(page);

    drawHeader({
      page,
      font,
      fontBold,
      title: meta.title,
      version: meta.version,
      effectiveDateText,
      logo: embeddedLogo
        ? {
            image: embeddedLogo,
            width: embeddedLogo.width,
            height: embeddedLogo.height,
          }
        : null,
    });

    const start = i * linesPerPage;
    const end = Math.min(allLines.length, start + linesPerPage);
    const slice = allLines.slice(start, end);

    let y = contentTopY - 18;
    for (const line of slice) {
      if (line === "") {
        y -= lineHeight;
        continue;
      }

      page.drawText(line, {
        x: PAGE.marginX,
        y,
        size: contentFontSize,
        font,
        color: GOJACK_CONFIG.primary,
      });

      y -= lineHeight;
    }
  }

  // Footer pass
  pages.forEach((p, idx) => {
    drawFooter({
      page: p,
      font,
      pageNumber: idx + 1,
      totalPages,
      docId: input.docId,
      version: meta.version,
    });
  });

  // Put signature image on last page (best-effort)
  if (embeddedSignature && pages.length) {
    const last = pages[pages.length - 1];

    const targetW = 180;
    const scale = targetW / embeddedSignature.width;
    const targetH = embeddedSignature.height * scale;

    const x = PAGE.marginX;
    const y = PAGE.marginBottom + PAGE.footerHeight + 40;

    last.drawText("Signature:", {
      x,
      y: y + targetH + 8,
      size: 10,
      font: fontBold,
      color: GOJACK_CONFIG.primary,
    });

    last.drawImage(embeddedSignature, {
      x,
      y,
      width: targetW,
      height: targetH,
    });
  }

  return await pdf.save(); // Uint8Array [web:449]
}

/**
 * Node convenience helper for route handlers returning PDF bytes.
 * (Your route.ts can import this.)
 */
export async function generateSignedLegalPdfBuffer(
  input: GeneratePdfInput
): Promise<Buffer> {
  const bytes = await generateSignedLegalPdfBytes(input);
  return Buffer.from(bytes);
}
