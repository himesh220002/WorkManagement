import connectToDatabase from "@/lib/mongodb";
import { ChatMessage, ChatAttachment } from "@/models";
import { deleteS3Object } from "@/lib/s3";

export interface CleanupResult {
  success: boolean;
  deletedS3Count: number;
  cleanedMessagesCount: number;
  error?: string;
}

/**
 * Automatically purges chat attachments older than 1 day (24 hours).
 * Deletes the objects from both AWS S3 bucket storage and chat messages in MongoDB.
 */
export async function cleanupExpiredChatAttachments(): Promise<CleanupResult> {
  try {
    await connectToDatabase();
    const now = new Date();
    let deletedS3Count = 0;
    let cleanedMessagesCount = 0;

    // 1. Find all tracked chat attachments that have reached their 1-day expiration
    const expiredAttachments = await ChatAttachment.find({
      expiresAt: { $lte: now },
      isDeleted: false,
    }).limit(100);

    const expiredS3Keys: string[] = [];

    for (const att of expiredAttachments) {
      if (att.s3Key) {
        try {
          await deleteS3Object(att.s3Key);
          deletedS3Count++;
          expiredS3Keys.push(att.s3Key);
        } catch (s3Err) {
          console.error(`[Chat S3 Cleanup] Error deleting s3Key "${att.s3Key}":`, s3Err);
        }
      }
      att.isDeleted = true;
      await att.save();
    }

    // 2. Chat-side cleanup: Remove expired attachments from ChatMessage documents
    // Match by expiresAt <= now or by specific expired s3Keys
    const pullCondition: any = {
      $or: [
        { expiresAt: { $lte: now } },
      ],
    };

    if (expiredS3Keys.length > 0) {
      pullCondition.$or.push({ s3Key: { $in: expiredS3Keys } });
    }

    const updateRes = await ChatMessage.updateMany(
      {
        $or: [
          { "attachments.expiresAt": { $lte: now } },
          ...(expiredS3Keys.length > 0 ? [{ "attachments.s3Key": { $in: expiredS3Keys } }] : []),
        ],
      },
      {
        $pull: {
          attachments: pullCondition,
        },
      }
    );

    cleanedMessagesCount = updateRes.modifiedCount || 0;

    // 3. Remove any orphaned messages that only had an attachment and no user text
    await ChatMessage.deleteMany({
      $and: [
        { attachments: { $size: 0 } },
        {
          $or: [
            { content: "" },
            { content: /^\[Attachment: .*\]$/ },
            { content: "Shared an attachment" },
          ],
        },
      ],
    });

    return {
      success: true,
      deletedS3Count,
      cleanedMessagesCount,
    };
  } catch (error: any) {
    console.error("[Chat S3 Cleanup] Cleanup failed:", error);
    return {
      success: false,
      deletedS3Count: 0,
      cleanedMessagesCount: 0,
      error: error.message || "Failed to cleanup expired attachments",
    };
  }
}
