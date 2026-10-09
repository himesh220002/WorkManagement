import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { ChatMessage } from "@/models";
import { getCurrentSession } from "@/server/auth/session";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getCurrentSession();

    if (!session.userId || session.isGuest) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { messageId, emoji } = await req.json();

    if (!messageId || !emoji) {
      return NextResponse.json(
        { success: false, error: "messageId and emoji are required" },
        { status: 400 }
      );
    }

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      // In case of seed message id
      return NextResponse.json({
        success: true,
        reactions: [{ emoji, userId: session.userId, userName: session.name || "You" }],
      });
    }

    const userName = session.name || session.email?.split("@")[0] || "User";
    const existingIndex = message.reactions.findIndex(
      (r) => r.userId === session.userId && r.emoji === emoji
    );

    if (existingIndex > -1) {
      // Remove reaction if already reacted with same emoji
      message.reactions.splice(existingIndex, 1);
    } else {
      // Add reaction
      message.reactions.push({
        emoji,
        userId: session.userId,
        userName,
      });
    }

    await message.save();

    return NextResponse.json({
      success: true,
      reactions: message.reactions,
    });
  } catch (error: any) {
    console.error("Failed to react to message:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update reaction" },
      { status: 500 }
    );
  }
}
