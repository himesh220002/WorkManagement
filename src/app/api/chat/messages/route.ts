import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { ChatMessage, ChatAttachment, SavedPerson } from "@/models";
import { getCurrentSession, getTenantQueryFilter } from "@/server/auth/session";
import { syncTenantWrite } from "@/lib/tenantDb";
import { cleanupExpiredChatAttachments } from "@/lib/chatAttachmentCleanup";

// Initial seed messages for demonstration and immediate rich experience
const INITIAL_SEED_MESSAGES = [
  {
    content: "🚀 Welcome to TaskPMS Company Chat Space! You can post global announcements, team updates, or message specific squad groups.",
    senderId: "system-lead",
    senderName: "Sarah Jenkins",
    senderRole: "VP of Engineering",
    senderAvatar: "SJ",
    scope: "global",
    targetScopeId: "global",
    targetScopeName: "Global All-Hands",
    mentionedUsers: [],
    reactions: [
      { emoji: "🚀", userId: "u-1", userName: "Marcus Chen" },
      { emoji: "🎉", userId: "u-2", userName: "Elena Rostova" },
    ],
    createdAt: new Date(Date.now() - 3600 * 1000 * 4),
  },
  {
    content: "Heads up team: @Satyam Himesh the Q4 release roadmap whiteboard is now live in the Whiteboards section. Let me know if any adjustments are needed!",
    senderId: "u-marcus",
    senderName: "Marcus Chen",
    senderRole: "Product Lead",
    senderAvatar: "MC",
    scope: "global",
    targetScopeId: "global",
    targetScopeName: "Global All-Hands",
    mentionedUsers: [{ userId: "u-satyam", name: "Satyam Himesh" }],
    reactions: [{ emoji: "👍", userId: "u-satyam", userName: "Satyam Himesh" }],
    createdAt: new Date(Date.now() - 3600 * 1000 * 2),
  },
  {
    content: "Engineering sync: S3 isolated tenancy migration is fully verified! All tenant buckets have 0 cross-talk.",
    senderId: "u-elena",
    senderName: "Elena Rostova",
    senderRole: "Principal Architect",
    senderAvatar: "ER",
    scope: "team",
    targetScopeId: "Engineering",
    targetScopeName: "Engineering Team",
    mentionedUsers: [],
    reactions: [{ emoji: "🔥", userId: "u-1", userName: "Marcus Chen" }],
    createdAt: new Date(Date.now() - 3600 * 1000 * 1.5),
  },
  {
    content: "Frontend Squad: @Satyam Himesh @Elena Rostova double-click on any whiteboard node to trigger direct inline editing and format bar.",
    senderId: "u-david",
    senderName: "David Kim",
    senderRole: "Frontend Lead",
    senderAvatar: "DK",
    scope: "group",
    targetScopeId: "frontend-squad",
    targetScopeName: "#frontend-squad",
    mentionedUsers: [
      { userId: "u-satyam", name: "Satyam Himesh" },
      { userId: "u-elena", name: "Elena Rostova" },
    ],
    reactions: [{ emoji: "❤️", userId: "u-satyam", userName: "Satyam Himesh" }],
    createdAt: new Date(Date.now() - 3600 * 1000 * 0.8),
  },
];

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getCurrentSession();
    const { searchParams } = new URL(req.url);

    const scope = searchParams.get("scope") || "global";
    const targetScopeId = searchParams.get("targetScopeId") || "global";

    const tenantFilter = getTenantQueryFilter(session);
    const query: any = {
      ...tenantFilter,
      scope,
    };

    if (scope !== "global" && targetScopeId) {
      query.targetScopeId = targetScopeId;
    }

    let messages = await ChatMessage.find(query)
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    // Asynchronously trigger 24h S3 and chatside purge
    cleanupExpiredChatAttachments().catch((cleanupErr) =>
      console.warn("[Chat Messages] Cleanup notice:", cleanupErr)
    );

    const now = new Date();

    // If no messages exist yet in database, provide seeded messages filtered by scope
    if (!messages || messages.length === 0) {
      const filteredSeed = INITIAL_SEED_MESSAGES.filter((m) => {
        if (scope === "global") return m.scope === "global";
        return m.scope === scope && m.targetScopeId === targetScopeId;
      });

      return NextResponse.json({
        success: true,
        messages: filteredSeed.map((m, idx) => ({
          ...m,
          _id: `seed-${idx}-${m.scope}`,
        })),
        isSeeded: true,
      });
    }

    // Filter out any expired attachments (> 1 day old) chatside immediately
    const sanitizedMessages = messages.map((m: any) => {
      const activeAttachments = (m.attachments || []).filter((att: any) => {
        if (!att.expiresAt) return true;
        return new Date(att.expiresAt) > now;
      });
      return {
        ...m,
        attachments: activeAttachments,
      };
    });

    return NextResponse.json({
      success: true,
      messages: sanitizedMessages,
      isSeeded: false,
    });
  } catch (error: any) {
    console.error("Failed to fetch chat messages:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getCurrentSession();

    if (session.isGuest || !session.userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required to post messages" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      content,
      scope = "global",
      targetScopeId = "global",
      targetScopeName = "All Company",
      mentionedUsers = [],
      attachments = [],
    } = body;

    const hasContent = content && content.trim().length > 0;
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

    if (!hasContent && !hasAttachments) {
      return NextResponse.json(
        { success: false, error: "Message content or file attachment required" },
        { status: 400 }
      );
    }

    const finalContent = hasContent
      ? content.trim()
      : attachments[0]?.name
      ? `Shared attachment: ${attachments[0].name}`
      : "Shared an attachment";

    // Standardize 1-day (24 hour) auto-expiration on all attachments
    const oneDayFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const processedAttachments = (attachments || []).map((att: any) => ({
      ...att,
      expiresAt: att.expiresAt ? new Date(att.expiresAt) : oneDayFromNow,
    }));

    const senderName = session.name || session.email?.split("@")[0] || "User";
    const senderRole = session.role || "Team Member";
    const initials = senderName
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const messageDoc = await ChatMessage.create({
      companyId: session.companyId,
      senderId: session.userId,
      senderName,
      senderEmail: session.email,
      senderRole,
      senderAvatar: initials,
      content: finalContent,
      scope,
      targetScopeId,
      targetScopeName,
      mentionedUsers,
      reactions: [],
      attachments: processedAttachments,
    });

    // Link uploaded attachments to this message in ChatAttachment tracker
    const s3Keys = processedAttachments.map((a: any) => a.s3Key).filter(Boolean);
    if (s3Keys.length > 0) {
      await ChatAttachment.updateMany(
        { s3Key: { $in: s3Keys } },
        { $set: { messageId: messageDoc._id } }
      ).catch(() => {});
    }

    // Fire background cleanup
    cleanupExpiredChatAttachments().catch(() => {});

    // Auto-save mentioned users into SavedPerson list for quick picking in the future
    if (Array.isArray(mentionedUsers) && mentionedUsers.length > 0) {
      for (const m of mentionedUsers) {
        if (!m.userId || m.userId === session.userId) continue;
        try {
          await SavedPerson.findOneAndUpdate(
            {
              ownerUserId: session.userId,
              personUserId: m.userId,
            },
            {
              companyId: session.companyId,
              ownerUserId: session.userId,
              personUserId: m.userId,
              personName: m.name,
              personEmail: m.email || "",
              personRole: "Team Member",
              $inc: { mentionCount: 1 },
              $set: { lastMentionedAt: new Date() },
            },
            { upsert: true, new: true }
          );
        } catch (saveErr) {
          console.warn("Could not upsert saved person:", saveErr);
        }
      }
    }

    if (session.companyCode) {
      await syncTenantWrite("ChatMessage", "create", messageDoc, undefined, session.companyCode);
    }

    return NextResponse.json({
      success: true,
      message: messageDoc,
    });
  } catch (error: any) {
    console.error("Failed to post chat message:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to post message" },
      { status: 500 }
    );
  }
}

function canModerate(role?: string | null) {
  return ["owner", "manager", "superuser"].includes((role || "").toLowerCase());
}

// Edit own message content
export async function PATCH(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getCurrentSession();

    if (session.isGuest || !session.userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required to edit messages" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { messageId, content } = body;

    if (!messageId) {
      return NextResponse.json(
        { success: false, error: "Message ID is required" },
        { status: 400 }
      );
    }
    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, error: "Message content cannot be empty" },
        { status: 400 }
      );
    }

    const msg = await ChatMessage.findById(messageId);
    if (!msg) {
      return NextResponse.json(
        { success: false, error: "Message not found" },
        { status: 404 }
      );
    }

    // Only the sender can edit their own message
    if (msg.senderId !== session.userId) {
      return NextResponse.json(
        { success: false, error: "You can only edit your own messages" },
        { status: 403 }
      );
    }

    msg.content = content.trim();
    msg.isEdited = true;
    await msg.save();

    if (session.companyCode) {
      await syncTenantWrite(
        "ChatMessage",
        "update",
        messageId,
        { content: msg.content, isEdited: true },
        session.companyCode
      );
    }

    return NextResponse.json({ success: true, message: msg });
  } catch (error: any) {
    console.error("Failed to edit chat message:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to edit message" },
      { status: 500 }
    );
  }
}

// Delete own message (managers/owners can remove any message)
export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getCurrentSession();

    if (session.isGuest || !session.userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required to delete messages" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get("messageId");

    if (!messageId) {
      return NextResponse.json(
        { success: false, error: "Message ID is required" },
        { status: 400 }
      );
    }

    const msg = await ChatMessage.findById(messageId);
    if (!msg) {
      return NextResponse.json(
        { success: false, error: "Message not found" },
        { status: 404 }
      );
    }

    if (msg.senderId !== session.userId && !canModerate(session.role)) {
      return NextResponse.json(
        { success: false, error: "You can only delete your own messages" },
        { status: 403 }
      );
    }

    await ChatMessage.findByIdAndDelete(messageId);

    if (session.companyCode) {
      await syncTenantWrite("ChatMessage", "delete", messageId, undefined, session.companyCode);
    }

    return NextResponse.json({ success: true, messageId });
  } catch (error: any) {
    console.error("Failed to delete chat message:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete message" },
      { status: 500 }
    );
  }
}
