import React from "react";
import connectToDatabase from "@/lib/mongodb";
import { Whiteboard } from "@/models";
import mongoose from "mongoose";
import { getCurrentSession, getTenantQueryFilter } from "@/server/auth/session";
import { serializeDocs } from "@/lib/serialize";
import WhiteboardCanvas from "@/components/whiteboard/WhiteboardCanvas";
import { ORG_CHART_NODES, ORG_CHART_EDGES } from "@/lib/whiteboardTemplates";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Whiteboard Editor | TaskPMS",
  description: "Collaborative canvas and visual organization blueprints",
};

export default async function WhiteboardEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await connectToDatabase();
  const session = await getCurrentSession();
  const { id } = await params;
  const sp = searchParams ? await searchParams : {};
  const isNew = sp?.isNew === "true" || sp?.isNew === "1";

  let rawBoard: any = null;

  if (id && mongoose.Types.ObjectId.isValid(id)) {
    try {
      rawBoard = await Whiteboard.findById(id).select("-passwordHash").lean();
    } catch {
      rawBoard = null;
    }
  }

  if (!rawBoard) {
    const tenantFilter = getTenantQueryFilter(session);
    try {
      rawBoard = await Whiteboard.findOne({
        ...tenantFilter,
        $or: [{ templateId: "org-chart" }, { title: /Organizational/i }],
      })
        .select("-passwordHash")
        .sort({ updatedAt: -1 })
        .lean();

      if (!rawBoard) {
        rawBoard = await Whiteboard.findOne({
          $or: [{ templateId: "org-chart" }, { title: /Organizational/i }],
        })
          .select("-passwordHash")
          .sort({ updatedAt: -1 })
          .lean();
      }
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
      isProtected: false,
      deleteRequiresPass: true,
      publicEdit: true,
      tempTokenPhrase: "839102",
      nodes: ORG_CHART_NODES,
      edges: ORG_CHART_EDGES,
      backgroundColor: "#0D0E11",
      updatedAt: new Date(),
    };
  }

  const initialBoard = serializeDocs([rawBoard])[0];

  return (
    <div className="w-full h-full">
      <WhiteboardCanvas
        initialBoard={initialBoard as any}
        currentUserName={session.name || session.email?.split("@")[0] || "User"}
        currentUserId={session.userId || ""}
        isNew={Boolean(isNew)}
      />
    </div>
  );
}
