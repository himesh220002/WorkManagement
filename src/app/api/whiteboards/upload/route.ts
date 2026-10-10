import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { getCurrentSession } from "@/server/auth/session";
import {
  uploadFileToS3,
  isAwsConfigured,
  generatePresignedDownloadUrl,
  deleteS3Object,
} from "@/lib/s3";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getCurrentSession();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const boardId = (formData.get("boardId") as string) || "general";

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    // Limit maximum whiteboard asset size to 50 MB
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: "File exceeds 50 MB whiteboard upload limit" },
        { status: 400 }
      );
    }

    const originalName = file.name;
    const ext = originalName.split(".").pop()?.toLowerCase() || "";
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const timestamp = Date.now();
    const companyId = session.companyId ? String(session.companyId) : "global";
    const s3Key = `${companyId}/whiteboards/${boardId}/${timestamp}_${safeName}`;

    const mimeType = file.type || "application/octet-stream";
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Upload directly to AWS S3 to keep Vercel and MongoDB payloads lightweight
    await uploadFileToS3(s3Key, fileBuffer, mimeType);

    // Generate permanent or presigned access URL
    let s3Url = "";
    const bucketName = process.env.AWS_S3_BUCKET_NAME || "company-pm-bucket";
    const region = process.env.AWS_REGION || "us-east-1";

    if (isAwsConfigured()) {
      // Generate secure 7-day presigned view/download URL (604,800 seconds)
      const presigned = await generatePresignedDownloadUrl(s3Key, originalName, 604800);
      s3Url = presigned.viewUrl;
    } else {
      // Local development mock mode fallback when AWS keys are not yet provided in .env
      s3Url = `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}?mock_storage=true`;
    }

    // Process preview text and metadata for text-based formats (.graphml, .json, .md, .txt)
    let previewText = "";
    const metaData: Record<string, any> = {};

    if (["graphml", "xml", "json", "md", "markdown", "txt", "csv"].includes(ext)) {
      try {
        const textContent = fileBuffer.toString("utf-8");
        previewText = textContent.slice(0, 15000); // Truncate safely for preview

        if (ext === "graphml" || ext === "xml") {
          // Parse node and edge tags in GraphML
          const nodeMatches = textContent.match(/<node\b/gi);
          const edgeMatches = textContent.match(/<edge\b/gi);
          metaData.nodeCount = nodeMatches ? nodeMatches.length : 0;
          metaData.edgeCount = edgeMatches ? edgeMatches.length : 0;

          // Attempt to extract graph label or ID
          const graphMatch = textContent.match(/<graph\b[^>]*id=["']([^"']+)["']/i);
          if (graphMatch) {
            metaData.graphId = graphMatch[1];
          }
        } else if (ext === "json") {
          try {
            const parsed = JSON.parse(textContent);
            metaData.isJson = true;
            metaData.keyCount = typeof parsed === "object" && parsed !== null ? Object.keys(parsed).length : 0;
            metaData.isArray = Array.isArray(parsed);
          } catch {
            metaData.isJson = false;
          }
        } else if (ext === "md" || ext === "markdown") {
          const lines = textContent.split("\n");
          metaData.lineCount = lines.length;
          metaData.wordCount = textContent.split(/\s+/).filter(Boolean).length;
        }
      } catch (err) {
        console.warn("Could not extract preview text:", err);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        url: s3Url,
        s3Key,
        fileName: originalName,
        fileSize: file.size,
        mimeType,
        extension: ext,
        previewText,
        metaData,
      },
    });
  } catch (error: any) {
    console.error("Whiteboard S3 upload error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to upload file to S3" },
      { status: 500 }
    );
  }
}

function normalizeS3Key(keyOrUrl: string): string {
  if (!keyOrUrl) return "";
  if (keyOrUrl.startsWith("http://") || keyOrUrl.startsWith("https://")) {
    try {
      const parsed = new URL(keyOrUrl);
      return decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
    } catch {
      return keyOrUrl;
    }
  }
  return keyOrUrl;
}

export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getCurrentSession();

    const body = await req.json().catch(() => ({}));
    const rawKeys = Array.isArray(body.s3Keys)
      ? body.s3Keys
      : body.s3Key
      ? [body.s3Key]
      : [];

    const s3Keys: string[] = rawKeys
      .map((k: any) => (typeof k === "string" ? normalizeS3Key(k.trim()) : ""))
      .filter((k: string) => k.length > 0);

    if (s3Keys.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid s3Key(s) provided" },
        { status: 400 }
      );
    }

    const companyId = session.companyId ? String(session.companyId) : "global";

    const results = await Promise.all(
      s3Keys.map(async (key) => {
        // Multi-tenant security check: ensure s3Key belongs to this company's namespace
        if (
          companyId !== "global" &&
          !key.startsWith(`${companyId}/whiteboards/`) &&
          !key.startsWith(`global/whiteboards/`)
        ) {
          console.warn(`[S3 DELETE] Unauthorized attempt to delete key "${key}" by company "${companyId}"`);
          return { key, success: false, error: "Unauthorized S3 key" };
        }

        try {
          const success = await deleteS3Object(key);
          return { key, success };
        } catch (err: any) {
          console.error(`[S3 DELETE] Failed to delete key "${key}":`, err);
          return { key, success: false, error: err.message };
        }
      })
    );

    const allSuccessful = results.every((r) => r.success);

    return NextResponse.json({
      success: allSuccessful,
      message: allSuccessful
        ? "S3 object(s) deleted successfully"
        : "Some S3 objects could not be deleted",
      results,
    });
  } catch (error: any) {
    console.error("Whiteboard S3 deletion error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete S3 object" },
      { status: 500 }
    );
  }
}

