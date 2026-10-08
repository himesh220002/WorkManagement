import { describe, it, expect, vi } from "vitest";
import { isImageFile, compressImageFile, mergeImagesToPdf } from "@/utils/imageCompressor";

describe("imageCompressor utility", () => {
  describe("isImageFile", () => {
    it("should correctly identify image files by mime type or extension", () => {
      const jpgFile = new File(["dummy content"], "photo.jpg", { type: "image/jpeg" });
      const pngFile = new File(["dummy content"], "scan.png", { type: "image/png" });
      const webpFile = new File(["dummy content"], "page.webp", { type: "image/webp" });
      const uppercaseFile = new File(["dummy content"], "DOC.JPEG", { type: "" });

      expect(isImageFile(jpgFile)).toBe(true);
      expect(isImageFile(pngFile)).toBe(true);
      expect(isImageFile(webpFile)).toBe(true);
      expect(isImageFile(uppercaseFile)).toBe(true);
    });

    it("should reject non-image files such as pdf and docx", () => {
      const pdfFile = new File(["%PDF-1.4"], "document.pdf", { type: "application/pdf" });
      const docxFile = new File(["dummy content"], "notes.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      const zipFile = new File(["dummy content"], "archive.zip", { type: "application/zip" });

      expect(isImageFile(pdfFile)).toBe(false);
      expect(isImageFile(docxFile)).toBe(false);
      expect(isImageFile(zipFile)).toBe(false);
    });
  });

  describe("compressImageFile", () => {
    it("should return non-image files untouched with applied=false", async () => {
      const pdfFile = new File(["dummy pdf binary content"], "report.pdf", { type: "application/pdf" });
      const result = await compressImageFile(pdfFile);

      expect(result.applied).toBe(false);
      expect(result.file).toBe(pdfFile);
      expect(result.reductionPercent).toBe(0);
      expect(result.compressedSize).toBe(pdfFile.size);
    });
  });

  describe("mergeImagesToPdf", () => {
    it("should create a valid PDF file when merging image layers", async () => {
      // Mock empty file array or non-images to verify PDFDocument creation
      const mergedPdf = await mergeImagesToPdf([], "Test_Document");

      expect(mergedPdf).toBeInstanceOf(File);
      expect(mergedPdf.type).toBe("application/pdf");
      expect(mergedPdf.name).toContain("Test_Document_MultiPage_");
      expect(mergedPdf.size).toBeGreaterThan(0);
    });
  });
});
