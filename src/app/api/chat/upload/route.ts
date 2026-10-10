import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { getCurrentSession } from "@/server/auth/session";
import {
  uploadFileToS3,
  isAwsConfigured,
  generatePresignedDownloadUrl,
  deleteS3Object,
  buildChatS3Key,
} from "@/lib/s3";
import { ChatAttachment } from "@/models";
import { cleanupExpiredChatAttachments } from "@/lib/chatAttachmentCleanup";

export const dynamic = "force-dynamic";

// Allowed extensions and MIME types for chat: images and PDFs only
const ALLOWED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg", "pdf"]);
const ALLOWED_MIME_PREFIXES = ["image/"];
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
]);

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getCurrentSession();

    if (session.isGuest || !session.userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required to upload chat files" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const channelId = (formData.get("channelId") as string) || "global";

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    // 1. Validate File Format (Images & PDF only)
    const originalName = file.name || "attachment";
    const ext = originalName.split(".").pop()?.toLowerCase() || "";
    const mimeType = file.type || "application/octet-stream";

    const isAllowedExt = ALLOWED_EXTENSIONS.has(ext);
    const isAllowedMime =
      ALLOWED_MIME_TYPES.has(mimeType) ||
      ALLOWED_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix));

    if (!isAllowedExt && !isAllowedMime) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid file type. Only image files (PNG, JPG, WEBP, GIF, SVG) and PDF documents (.pdf) are allowed.",
        },
        { status: 400 }
      );
    }

    // 2. Validate Size Limit (25 MB max)
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: "File exceeds 25 MB chat upload limit" },
        { status: 400 }
      );
    }

    const fileType: "image" | "pdf" = ext === "pdf" || mimeType === "application/pdf" ? "pdf" : "image";

    // 3. 1-Day Auto-Expiration Timestamp (exactly 24 hours from now)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const companyId = session.companyId ? String(session.companyId) : "global";
    const s3Key = buildChatS3Key(companyId, channelId, originalName);

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // 4. Upload object directly to S3
    await uploadFileToS3(s3Key, fileBuffer, mimeType);

    // 5. Build S3 access URL
    let s3Url = "";
    const bucketName = process.env.AWS_S3_BUCKET_NAME || "company-pm-bucket";
    const region = process.env.AWS_REGION || "us-east-1";

    if (isAwsConfigured()) {
      // 24-hour presigned view URL (86400 seconds) matching 1-day self-deletion
      const presigned = await generatePresignedDownloadUrl(s3Key, originalName, 86400);
      s3Url = presigned.viewUrl;
    } else {
      s3Url = `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}?mock_storage=true`;
    }

    const isHdOriginal = formData.get("isHdOriginal") === "true";
    const originalSize = Number(formData.get("originalSize")) || file.size;
    const reductionPercent = Number(formData.get("reductionPercent")) || 0;

    // 6. Record tracking document for lifecycle management
    await ChatAttachment.create({
      companyId: session.companyId,
      s3Key,
      fileName: originalName,
      fileType,
      mimeType,
      fileSize: file.size,
      originalSize,
      isHdOriginal,
      reductionPercent,
      url: s3Url,
      expiresAt,
      isDeleted: false,
    });

    // 7. Fire background self-deletion cleaner
    cleanupExpiredChatAttachments().catch((cleanupErr) =>
      console.warn("[Chat Upload] Background cleanup notice:", cleanupErr)
    );

    return NextResponse.json({
      success: true,
      attachment: {
        name: originalName,
        url: s3Url,
        s3Key,
        size: file.size,
        originalSize,
        type: fileType,
        mimeType,
        isHdOriginal,
        reductionPercent,
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Chat upload failed:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to upload file to S3" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getCurrentSession();

    if (session.isGuest || !session.userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required to delete attachments" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const s3Key = body.s3Key as string;

    if (!s3Key) {
      return NextResponse.json({ success: false, error: "s3Key is required" }, { status: 400 });
    }

    const companyId = session.companyId ? String(session.companyId) : "global";
    if (companyId !== "global" && !s3Key.startsWith(`${companyId}/chat/`)) {
      return NextResponse.json({ success: false, error: "Unauthorized S3 key" }, { status: 403 });
    }

    await deleteS3Object(s3Key);
    await ChatAttachment.updateOne({ s3Key }, { $set: { isDeleted: true } });

    return NextResponse.json({
      success: true,
      message: "Chat attachment deleted from S3",
    });
  } catch (error: any) {
    console.error("Chat attachment manual delete failed:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete attachment" },
      { status: 500 }
    );
  }
}
