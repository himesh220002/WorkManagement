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

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getCurrentSession();
    const tenantFilter = getTenantQueryFilter(session);

    let boards = await Whiteboard.find(tenantFilter)
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
        nodes: ORG_CHART_NODES,
        edges: ORG_CHART_EDGES,
      });

      if (session.companyCode) {
        await syncTenantWrite("Whiteboard", "create", defaultBoard, undefined, session.companyCode);
      }

      return NextResponse.json({
        success: true,
        whiteboards: [defaultBoard],
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
    const { title = "Untitled Whiteboard", templateId = "blank" } = body;

    let nodes: any[] = [];
    let edges: any[] = [];

    const selectedTemplate = WHITEBOARD_TEMPLATES.find((t) => t.id === templateId);
    if (selectedTemplate) {
      nodes = selectedTemplate.nodes;
      edges = selectedTemplate.edges;
    }

    const authorName = session.name || session.email?.split("@")[0] || "User";
    const authorInitials = authorName
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const newBoard = await Whiteboard.create({
      companyId: session.companyId,
      title: title.trim(),
      description: selectedTemplate?.description || "Interactive team collaborative canvas",
      templateId,
      isFavorite: false,
      authorName,
      authorId: session.userId,
      authorInitials,
      nodes,
      edges,
    });

    if (session.companyCode) {
      await syncTenantWrite("Whiteboard", "create", newBoard, undefined, session.companyCode);
    }

    return NextResponse.json({
      success: true,
      whiteboard: newBoard,
    });
  } catch (error: any) {
    console.error("Failed to create whiteboard:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create whiteboard" },
      { status: 500 }
    );
  }
}
