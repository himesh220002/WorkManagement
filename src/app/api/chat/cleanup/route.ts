import { NextRequest, NextResponse } from "next/server";
import { cleanupExpiredChatAttachments } from "@/lib/chatAttachmentCleanup";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const result = await cleanupExpiredChatAttachments();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Cleanup failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const result = await cleanupExpiredChatAttachments();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Cleanup failed" },
      { status: 500 }
    );
  }
}
