import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Whiteboard } from "@/models";
import { getCurrentSession, getTenantQueryFilter, UNASSIGNED_TENANT_ID } from "@/server/auth/session";
import { syncTenantWrite } from "@/lib/tenantDb";
import { ORG_CHART_NODES, ORG_CHART_EDGES } from "@/lib/whiteboardTemplates";
import mongoose from "mongoose";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const session = await getCurrentSession();
    const { id } = await context.params;

    if (id === "org-chart" || id === "default" || id === "default-org-chart") {
      const tenantFilter = getTenantQueryFilter(session);
      let existing: any = await Whiteboard.findOne({
        ...tenantFilter,
        $or: [{ templateId: "org-chart" }, { title: /Organizational/i }],
      }).sort({ updatedAt: -1 }).lean();

      if (!existing) {
        existing = await Whiteboard.findOne({
          $or: [{ templateId: "org-chart" }, { title: /Organizational/i }],
        }).sort({ updatedAt: -1 }).lean();
      }

      if (existing) {
        return NextResponse.json({
          success: true,
          whiteboard: existing,
        });
      }

      return NextResponse.json({
        success: true,
        whiteboard: {
          _id: "default-org-chart",
          title: "Organizational Chart",
          templateId: "org-chart",
          isFavorite: true,
          backgroundColor: "#0D0E11",
          authorName: session.name || "Himesh S",
          authorInitials: "HS",
          nodes: ORG_CHART_NODES,
          edges: ORG_CHART_EDGES,
          updatedAt: new Date(),
        },
      });
    }

    let board: any = null;
    if (id && mongoose.Types.ObjectId.isValid(id)) {
      board = await Whiteboard.findById(id).lean();
    }

    if (!board) {
      const tenantFilter = getTenantQueryFilter(session);
      board = await Whiteboard.findOne({
        ...tenantFilter,
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
    const { title, nodes, edges, isFavorite, description, backgroundColor } = body;

    const updateFields: any = { updatedAt: new Date() };
    if (title !== undefined) updateFields.title = title;
    if (nodes !== undefined) updateFields.nodes = nodes;
    if (edges !== undefined) updateFields.edges = edges;
    if (isFavorite !== undefined) updateFields.isFavorite = isFavorite;
    if (description !== undefined) updateFields.description = description;
    if (backgroundColor !== undefined) updateFields.backgroundColor = backgroundColor;

    let updatedBoard: any = null;

    if (id && mongoose.Types.ObjectId.isValid(id)) {
      updatedBoard = await Whiteboard.findByIdAndUpdate(
        id,
        { $set: updateFields },
        { new: true }
      );
    }

    if (!updatedBoard) {
      const tenantFilter = getTenantQueryFilter(session);
      updatedBoard = await Whiteboard.findOneAndUpdate(
        {
          ...tenantFilter,
          $or: [
            { templateId: "org-chart" },
            { title: title || "Organizational Chart" },
          ],
        },
        { $set: updateFields },
        { new: true }
      );

      if (!updatedBoard) {
        updatedBoard = await Whiteboard.findOneAndUpdate(
          {
            $or: [
              { templateId: "org-chart" },
              { title: title || "Organizational Chart" },
            ],
          },
          { $set: updateFields },
          { new: true }
        );
      }

      if (!updatedBoard && (id === "default-org-chart" || id === "org-chart" || id === "default")) {
        const resolvedCompanyId =
          session.companyId && mongoose.Types.ObjectId.isValid(session.companyId)
            ? new mongoose.Types.ObjectId(session.companyId)
            : UNASSIGNED_TENANT_ID;

        updatedBoard = await Whiteboard.create({
          companyId: resolvedCompanyId,
          title: title || "Organizational Chart",
          description: description || "",
          backgroundColor: backgroundColor || "#0D0E11",
          templateId: "org-chart",
          isFavorite: isFavorite ?? true,
          authorName: session.name || "User",
          nodes: nodes || ORG_CHART_NODES,
          edges: edges || ORG_CHART_EDGES,
        });
      }
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

    if (id && mongoose.Types.ObjectId.isValid(id)) {
      await Whiteboard.findByIdAndDelete(id);
    } else {
      const tenantFilter = getTenantQueryFilter(session);
      await Whiteboard.findOneAndDelete({
        ...tenantFilter,
        $or: [{ templateId: "org-chart" }, { title: /Organizational/i }],
      });
    }

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
