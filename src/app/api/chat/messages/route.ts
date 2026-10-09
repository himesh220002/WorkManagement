import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { ChatMessage, SavedPerson } from "@/models";
import { getCurrentSession, getTenantQueryFilter } from "@/server/auth/session";
import { syncTenantWrite } from "@/lib/tenantDb";

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

    return NextResponse.json({
      success: true,
      messages,
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

    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, error: "Message content cannot be empty" },
        { status: 400 }
      );
    }

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
      content: content.trim(),
      scope,
      targetScopeId,
      targetScopeName,
      mentionedUsers,
      reactions: [],
      attachments,
    });

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
