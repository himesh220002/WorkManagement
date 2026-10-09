import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { IAIReportMetrics } from "@/models/aiReport";

export interface PDFReportOptions {
  title: string;
  category: string;
  companyName: string;
  model: string;
  createdAt?: string | Date;
  metrics?: IAIReportMetrics;
  content: string;
}

function sanitizeWinAnsi(text: string): string {
  if (!text) return "";
  return text
    .replace(/[≥]/g, ">=")
    .replace(/[≤]/g, "<=")
    .replace(/[±]/g, "+/-")
    .replace(/[•]/g, "*")
    .replace(/[✓✔]/g, "[OK]")
    .replace(/[⚠️🚨❗]/g, "[!]")
    .replace(/[—–]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[…]/g, "...")
    .replace(/[\u200B\u00A0]/g, " ")
    .replace(/[^\x20-\x7E\t\n\r]/g, ""); // Keep standard WinAnsi printable ASCII
}

export async function generateReportPDF(options: PDFReportOptions): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Dimensions: Standard A4 in points (595.28 x 841.89)
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 45;
  const contentWidth = pageWidth - margin * 2;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  // Header Banner
  page.drawRectangle({
    x: margin,
    y: y - 50,
    width: contentWidth,
    height: 50,
    color: rgb(0.06, 0.09, 0.16), // Dark slate navy
  });

  page.drawText("TASKPMS · AI INTELLIGENCE & EXECUTIVE REPORT", {
    x: margin + 14,
    y: y - 20,
    size: 9,
    font: fontBold,
    color: rgb(0.22, 0.74, 0.97), // Cyan accent
  });

  const dateStr = options.createdAt
    ? new Date(options.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  page.drawText(
    sanitizeWinAnsi(`Organization: ${options.companyName}  |  Date: ${dateStr}  |  Model: ${options.model}`),
    {
      x: margin + 14,
      y: y - 38,
      size: 8.5,
      font: fontRegular,
      color: rgb(0.8, 0.85, 0.9),
    }
  );

  y -= 75;

  // Title
  const cleanTitle = sanitizeWinAnsi(options.title.replace(/^#\s*/, ""));
  page.drawText(cleanTitle.slice(0, 75), {
    x: margin,
    y,
    size: 16,
    font: fontBold,
    color: rgb(0.1, 0.12, 0.18),
  });
  y -= 25;

  // KPI Metrics Strip
  if (options.metrics) {
    const kpiHeight = 52;
    page.drawRectangle({
      x: margin,
      y: y - kpiHeight,
      width: contentWidth,
      height: kpiHeight,
      color: rgb(0.96, 0.97, 0.99),
      borderColor: rgb(0.85, 0.88, 0.92),
      borderWidth: 1,
    });

    const colWidth = contentWidth / 4;
    const health = options.metrics.healthScore ?? 85;
    const healthColor = health >= 75 ? rgb(0.06, 0.72, 0.5) : health >= 50 ? rgb(0.96, 0.62, 0.04) : rgb(0.93, 0.27, 0.27);

    // KPI 1: Health
    page.drawText("PROJECT HEALTH", { x: margin + 10, y: y - 18, size: 7.5, font: fontBold, color: rgb(0.4, 0.45, 0.55) });
    page.drawText(`${health}%`, { x: margin + 10, y: y - 38, size: 16, font: fontBold, color: healthColor });

    // KPI 2: Overdue
    const overdue = options.metrics.deadlinesOverdue ?? 0;
    page.drawText("OVERDUE DEADLINES", { x: margin + colWidth + 10, y: y - 18, size: 7.5, font: fontBold, color: rgb(0.4, 0.45, 0.55) });
    page.drawText(`${overdue}`, { x: margin + colWidth + 10, y: y - 38, size: 16, font: fontBold, color: overdue > 0 ? rgb(0.93, 0.27, 0.27) : rgb(0.2, 0.7, 0.4) });

    // KPI 3: Problems & Solutions
    const probs = options.metrics.problemsIdentified ?? 0;
    const sols = options.metrics.solutionsProposed ?? 0;
    page.drawText("PROBLEMS / SOLUTIONS", { x: margin + colWidth * 2 + 10, y: y - 18, size: 7.5, font: fontBold, color: rgb(0.4, 0.45, 0.55) });
    page.drawText(`${probs} / ${sols}`, { x: margin + colWidth * 2 + 10, y: y - 38, size: 16, font: fontBold, color: rgb(0.15, 0.45, 0.85) });

    // KPI 4: Velocity / Effort
    const velocity = options.metrics.velocityScore ?? 75;
    page.drawText("VELOCITY / EFFORT", { x: margin + colWidth * 3 + 10, y: y - 18, size: 7.5, font: fontBold, color: rgb(0.4, 0.45, 0.55) });
    page.drawText(`${velocity}%`, { x: margin + colWidth * 3 + 10, y: y - 38, size: 16, font: fontBold, color: rgb(0.1, 0.12, 0.18) });

    y -= kpiHeight + 25;
  }

  // Draw Content Lines with text wrapping
  const rawLines = options.content.split("\n");

  for (const rawLine of rawLines) {
    if (y < margin + 40) {
      // Add new page
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin - 20;

      // Small top header on continuation pages
      page.drawText(`TaskPMS · ${cleanTitle.slice(0, 50)} (Continuation)`, {
        x: margin,
        y,
        size: 8,
        font: fontOblique,
        color: rgb(0.5, 0.55, 0.6),
      });
      y -= 25;
    }

    const trimmed = rawLine.trim();

    if (!trimmed) {
      y -= 8;
      continue;
    }

    if (trimmed.startsWith("# ")) {
      // Skip top heading as it's already rendered in title banner
      continue;
    }

    if (trimmed.startsWith("## ")) {
      y -= 12;
      const h2Text = sanitizeWinAnsi(trimmed.replace(/^##\s*/, "")).slice(0, 85);
      page.drawText(h2Text, {
        x: margin,
        y,
        size: 12.5,
        font: fontBold,
        color: rgb(0.08, 0.15, 0.28),
      });
      y -= 18;
      continue;
    }

    if (trimmed.startsWith("### ")) {
      y -= 8;
      const h3Text = sanitizeWinAnsi(trimmed.replace(/^###\s*/, "")).slice(0, 85);
      page.drawText(h3Text, {
        x: margin,
        y,
        size: 10.5,
        font: fontBold,
        color: rgb(0.15, 0.3, 0.5),
      });
      y -= 16;
      continue;
    }

    if (trimmed.startsWith("---")) {
      page.drawLine({
        start: { x: margin, y },
        end: { x: pageWidth - margin, y },
        thickness: 0.8,
        color: rgb(0.85, 0.88, 0.92),
      });
      y -= 14;
      continue;
    }

    // Wrap regular text or bullet points
    const isBullet = trimmed.startsWith("- ") || trimmed.startsWith("* ");
    const textContent = sanitizeWinAnsi(isBullet ? trimmed.slice(2) : trimmed);
    const indent = isBullet ? margin + 12 : margin;

    if (isBullet) {
      page.drawCircle({
        x: margin + 4,
        y: y + 3,
        size: 2,
        color: rgb(0.2, 0.5, 0.9),
      });
    }

    const wrappedLines = wrapText(textContent, contentWidth - (isBullet ? 16 : 0), 9.5);
    for (const wl of wrappedLines) {
      if (y < margin + 30) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin - 30;
      }

      const cleanWl = sanitizeWinAnsi(wl);
      page.drawText(cleanWl, {
        x: indent,
        y,
        size: 9,
        font: fontRegular,
        color: rgb(0.2, 0.22, 0.26),
      });
      y -= 13;
    }
  }

  // Footer on final page
  page.drawText("Generated by TaskPMS AI Intelligence Engine - Confidential Executive Report", {
    x: margin,
    y: 20,
    size: 7.5,
    font: fontOblique,
    color: rgb(0.55, 0.6, 0.65),
  });

  return await pdfDoc.save();
}

function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  // Approximate character width for Helvetica is ~0.52 of font size
  const maxChars = Math.floor(maxWidth / (fontSize * 0.52));
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).trim().length <= maxChars) {
      currentLine = currentLine ? currentLine + " " + word : word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export const generateExecutivePDF = generateReportPDF;
