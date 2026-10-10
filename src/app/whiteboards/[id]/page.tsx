import React from "react";
import connectToDatabase from "@/lib/mongodb";
import { Whiteboard } from "@/models";
import mongoose from "mongoose";
import { getCurrentSession, getTenantQueryFilter } from "@/server/auth/session";
import { serializeDocs } from "@/lib/serialize";
import WhiteboardCanvas from "@/components/whiteboard/WhiteboardCanvas";
import { ORG_CHART_NODES, ORG_CHART_EDGES } from "@/lib/whiteboardTemplates";

export const metadata = {
  title: "Whiteboard Editor | TaskPMS",
  description: "Collaborative canvas and visual organization blueprints",
};

export default async function WhiteboardEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connectToDatabase();
  const session = await getCurrentSession();
  const { id } = await params;

  let rawBoard: any = null;

  if (id && mongoose.Types.ObjectId.isValid(id)) {
    try {
      rawBoard = await Whiteboard.findById(id).lean();
    } catch {
      rawBoard = null;
    }
  }

  if (!rawBoard) {
    const tenantFilter = getTenantQueryFilter(session);
    try {
      rawBoard = await Whiteboard.findOne({
        ...tenantFilter,
        templateId: "org-chart",
      }).lean();
    } catch {
      rawBoard = null;
    }
  }

  if (!rawBoard) {
    rawBoard = {
      _id: "default-org-chart",
      title: "Organizational Chart",
      templateId: "org-chart",
      isFavorite: true,
      authorName: session.name || "Himesh S",
      authorInitials: "HS",
      nodes: ORG_CHART_NODES,
      edges: ORG_CHART_EDGES,
      updatedAt: new Date(),
    };
  }

  const initialBoard = serializeDocs([rawBoard])[0];

  return (
    <div className="w-full h-full">
      <WhiteboardCanvas
        initialBoard={initialBoard as any}
        currentUserName={session.name || "User"}
      />
    </div>
  );
}
