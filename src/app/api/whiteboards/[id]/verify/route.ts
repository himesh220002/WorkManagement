import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Whiteboard } from "@/models";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await context.params;
    const body = await req.json();
    const { tokenOrPass = "" } = body;

    const trimmedInput = String(tokenOrPass).trim();
    if (!trimmedInput) {
      return NextResponse.json(
        { success: false, error: "Please enter a PIN, password, or 6-digit temporary token phrase." },
        { status: 400 }
      );
    }

    let board: any = null;
    if (id && mongoose.Types.ObjectId.isValid(id)) {
      board = await Whiteboard.findById(id);
    } else {
      board = await Whiteboard.findOne({
        $or: [{ templateId: "org-chart" }, { title: /Organizational/i }],
      });
    }

    if (!board) {
      return NextResponse.json(
        { success: false, error: "Whiteboard not found." },
        { status: 404 }
      );
    }

    const matchesToken = Boolean(
      board.tempTokenPhrase && board.tempTokenPhrase.trim() === trimmedInput
    );

    let matchesPass = false;
    if (board.passwordHash) {
      matchesPass = await bcrypt.compare(trimmedInput, board.passwordHash);
    }

    if (matchesPass || matchesToken) {
      return NextResponse.json({
        success: true,
        canEdit: true,
        isMaster: matchesPass,
        message: matchesPass
          ? "Master access granted (PIN/Password verified)."
          : "Temporary edit permission granted via 6-digit phrase.",
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Incorrect PIN, password, or 6-digit token phrase. Please request access from the whiteboard creator.",
      },
      { status: 401 }
    );
  } catch (error: any) {
    console.error("Failed to verify whiteboard token/password:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to verify access." },
      { status: 500 }
    );
  }
}
