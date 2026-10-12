import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Whiteboard } from "@/models";
import { getCurrentSession, getTenantQueryFilter } from "@/server/auth/session";
import { syncTenantWrite } from "@/lib/tenantDb";
import {
  WHITEBOARD_TEMPLATES,
  ORG_CHART_NODES,
  ORG_CHART_EDGES,
} from "@/lib/whiteboardTemplates";

import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getCurrentSession();
    const tenantFilter = getTenantQueryFilter(session);

    let boards = await Whiteboard.find(tenantFilter)
      .select("-passwordHash")
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    // If no whiteboards exist yet, create and persist the default "Organizational Chart"
    if (!boards || boards.length === 0) {
      const authorName = session.name || session.email?.split("@")[0] || "Himesh S";
      const authorInitials = authorName
        .split(" ")
        .map((w: string) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "HS";

      const defaultBoard = await Whiteboard.create({
        companyId: session.companyId,
        title: "Organizational Chart",
        description: "Visualize your team structure and hierarchical reporting lines",
        templateId: "org-chart",
        isFavorite: true,
        authorName,
        authorId: session.userId || "",
        authorInitials,
        isProtected: false,
        deleteRequiresPass: true,
        publicEdit: true,
        tempTokenPhrase: Math.floor(100000 + Math.random() * 900000).toString(),
        nodes: ORG_CHART_NODES,
        edges: ORG_CHART_EDGES,
      });

      if (session.companyCode) {
        await syncTenantWrite("Whiteboard", "create", defaultBoard, undefined, session.companyCode);
      }

      const boardObj = defaultBoard.toObject ? defaultBoard.toObject() : defaultBoard;
      delete (boardObj as any).passwordHash;

      return NextResponse.json({
        success: true,
        whiteboards: [boardObj],
      });
    }

    return NextResponse.json({
      success: true,
      whiteboards: boards,
    });
  } catch (error: any) {
    console.error("Failed to fetch whiteboards:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch whiteboards" },
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
        { success: false, error: "Authentication required to create a whiteboard" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      title = "Untitled Whiteboard",
      templateId = "blank",
      authorName: customAuthorName,
      isProtected = false,
      securityType = "pin",
      password = "",
      deleteRequiresPass = true,
      publicEdit = true,
      tempTokenPhrase: customTempToken,
    } = body;

    let nodes: any[] = [];
    let edges: any[] = [];

    const selectedTemplate = WHITEBOARD_TEMPLATES.find((t) => t.id === templateId);
    if (selectedTemplate) {
      nodes = selectedTemplate.nodes;
      edges = selectedTemplate.edges;
    }

    const authorName = (customAuthorName && customAuthorName.trim().length > 0)
      ? customAuthorName.trim()
      : (session.name || session.email?.split("@")[0] || "User");

    const authorInitials = authorName
      .split(" ")
      .map((w: string) => w[0])
      .filter(Boolean)
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

    let passwordHash = "";
    const isProt = Boolean(isProtected && password && password.trim().length > 0);

    if (isProt) {
      const cleanPass = password.trim();
      if (securityType === "pin") {
        if (!/^\d{4}$/.test(cleanPass)) {
          return NextResponse.json(
            { success: false, error: "4-digit PIN must contain exactly 4 numbers" },
            { status: 400 }
          );
        }
      } else {
        if (cleanPass.length < 6) {
          return NextResponse.json(
            { success: false, error: "Password must be at least 6 characters long" },
            { status: 400 }
          );
        }
      }
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(cleanPass, salt);
    }

    // Generate 6-digit temporary token phrase if not provided
    const tempTokenPhrase = (customTempToken && /^\d{6}$/.test(customTempToken.trim()))
      ? customTempToken.trim()
      : Math.floor(100000 + Math.random() * 900000).toString();

    const newBoard = await Whiteboard.create({
      companyId: session.companyId,
      title: title.trim(),
      description: selectedTemplate?.description || "Interactive team collaborative canvas",
      templateId,
      isFavorite: false,
      authorName,
      authorId: session.userId,
      authorInitials,
      isProtected: isProt,
      securityType: isProt ? securityType : "pin",
      passwordHash,
      deleteRequiresPass: Boolean(deleteRequiresPass),
      publicEdit: Boolean(publicEdit),
      tempTokenPhrase,
      nodes,
      edges,
    });

    if (session.companyCode) {
      await syncTenantWrite("Whiteboard", "create", newBoard, undefined, session.companyCode);
    }

    const boardObj = newBoard.toObject ? newBoard.toObject() : newBoard;
    delete (boardObj as any).passwordHash;

    return NextResponse.json({
      success: true,
      whiteboard: boardObj,
    });
  } catch (error: any) {
    console.error("Failed to create whiteboard:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create whiteboard" },
      { status: 500 }
    );
  }
}
