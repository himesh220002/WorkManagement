import { PDFDocument } from "pdf-lib";

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  reductionPercent: number;
  applied: boolean;
}

/**
 * Checks whether the given file is an image that can be visually compressed or merged into a multi-page PDF
 */
export function isImageFile(file: File): boolean {
  if (file.type && file.type.startsWith("image/")) return true;
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  return [".png", ".jpg", ".jpeg", ".webp", ".bmp"].includes(ext);
}

/**
 * Compresses an image in the browser using HTML5 Canvas
 * Reduces resolution to maxDimension and adjusts JPEG quality to reduce file size ("dulling quality" as requested)
 */
export async function compressImageFile(
  file: File,
  quality = 0.68,
  maxDimension = 1600
): Promise<CompressionResult> {
  const originalSize = file.size;

  if (!isImageFile(file)) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      reductionPercent: 0,
      applied: false,
    };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate proportional scale down if larger than maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return resolve({
            file,
            originalSize,
            compressedSize: originalSize,
            reductionPercent: 0,
            applied: false,
          });
        }

        // Fill white background for potential transparency issues
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve({
                file,
                originalSize,
                compressedSize: originalSize,
                reductionPercent: 0,
                applied: false,
              });
            }

            // Clean filename with jpg extension
            const baseName = file.name.replace(/\.[^/.]+$/, "");
            const newName = `${baseName}.jpg`;
            const compressedFile = new File([blob], newName, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });

            const compressedSize = compressedFile.size;
            const reductionPercent = Math.max(
              0,
              Math.round(((originalSize - compressedSize) / originalSize) * 100)
            );

            resolve({
              file: compressedFile,
              originalSize,
              compressedSize,
              reductionPercent,
              applied: true,
            });
          },
          "image/jpeg",
          quality
        );
      };

      img.onerror = () => {
        resolve({
          file,
          originalSize,
          compressedSize: originalSize,
          reductionPercent: 0,
          applied: false,
        });
      };

      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };

    reader.onerror = () => {
      resolve({
        file,
        originalSize,
        compressedSize: originalSize,
        reductionPercent: 0,
        applied: false,
      });
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Converts any image file to a standard JPEG Blob via canvas so pdf-lib can reliably embed it
 */
async function fileToJpegBytes(file: File): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas context failed"));
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, img.width, img.height);
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          async (blob) => {
            if (!blob) return reject(new Error("Failed to export image blob"));
            const arrayBuffer = await blob.arrayBuffer();
            resolve({
              bytes: new Uint8Array(arrayBuffer),
              width: img.width,
              height: img.height,
            });
          },
          "image/jpeg",
          0.85
        );
      };
      img.onerror = reject;
      if (e.target?.result) img.src = e.target.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Merges multiple image page layers (2-10+ pages) into a single unified multi-page PDF document
 */
export async function mergeImagesToPdf(
  files: File[],
  documentTitle = "Combined_Document"
): Promise<File> {
  const pdfDoc = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    if (isImageFile(file)) {
      try {
        const { bytes, width, height } = await fileToJpegBytes(file);
        const embeddedImage = await pdfDoc.embedJpg(bytes);

        // Standard PDF page dimensions matching image aspect ratio
        const page = pdfDoc.addPage([width, height]);
        page.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width,
          height,
        });
      } catch (err) {
        console.error(`Failed to embed page ${i + 1} into PDF:`, err);
      }
    }
  }

  const pdfBytes = await pdfDoc.save();
  const safeName = documentTitle.replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `${safeName || "Document"}_MultiPage_${Date.now()}.pdf`;

  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
  return new File([blob], fileName, {
    type: "application/pdf",
    lastModified: Date.now(),
  });
}
