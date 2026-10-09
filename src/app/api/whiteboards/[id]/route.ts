import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Whiteboard } from "@/models";
import { getCurrentSession } from "@/server/auth/session";
import { syncTenantWrite } from "@/lib/tenantDb";
import { ORG_CHART_NODES, ORG_CHART_EDGES } from "@/lib/whiteboardTemplates";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const session = await getCurrentSession();
    const { id } = await context.params;

    if (id === "org-chart" || id === "default") {
      return NextResponse.json({
        success: true,
        whiteboard: {
          _id: "default-org-chart",
          title: "Organizational Chart",
          templateId: "org-chart",
          isFavorite: true,
          authorName: session.name || "Himesh S",
          authorInitials: "HS",
          nodes: ORG_CHART_NODES,
          edges: ORG_CHART_EDGES,
          updatedAt: new Date(),
        },
      });
    }

    let board = await Whiteboard.findById(id).lean();

    if (!board) {
      // Check if title search matches or fallback to default
      board = await Whiteboard.findOne({
        $or: [{ templateId: "org-chart" }, { title: /Organizational/i }],
      }).lean();
    }

    if (!board) {
      return NextResponse.json(
        { success: false, error: "Whiteboard not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      whiteboard: board,
    });
  } catch (error: any) {
    console.error("Failed to get whiteboard:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve whiteboard" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const session = await getCurrentSession();
    const { id } = await context.params;

    const body = await req.json();
    const { title, nodes, edges, isFavorite, description } = body;

    const updateFields: any = { updatedAt: new Date() };
    if (title !== undefined) updateFields.title = title;
    if (nodes !== undefined) updateFields.nodes = nodes;
    if (edges !== undefined) updateFields.edges = edges;
    if (isFavorite !== undefined) updateFields.isFavorite = isFavorite;
    if (description !== undefined) updateFields.description = description;

    let updatedBoard = await Whiteboard.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedBoard && (id === "default-org-chart" || id === "org-chart")) {
      updatedBoard = await Whiteboard.create({
        companyId: session.companyId,
        title: title || "Organizational Chart",
        templateId: "org-chart",
        isFavorite: isFavorite ?? true,
        authorName: session.name || "User",
        nodes: nodes || ORG_CHART_NODES,
        edges: edges || ORG_CHART_EDGES,
      });
    }

    if (session.companyCode && updatedBoard) {
      await syncTenantWrite("Whiteboard", "update", updatedBoard, undefined, session.companyCode);
    }

    return NextResponse.json({
      success: true,
      whiteboard: updatedBoard,
    });
  } catch (error: any) {
    console.error("Failed to update whiteboard:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save whiteboard" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const session = await getCurrentSession();
    const { id } = await context.params;

    await Whiteboard.findByIdAndDelete(id);

    if (session.companyCode) {
      await syncTenantWrite("Whiteboard", "delete", { _id: id }, undefined, session.companyCode);
    }

    return NextResponse.json({ success: true, deleted: true });
  } catch (error: any) {
    console.error("Failed to delete whiteboard:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete whiteboard" },
      { status: 500 }
    );
  }
}
