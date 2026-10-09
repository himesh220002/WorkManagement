import React from "react";
import connectToDatabase from "@/lib/mongodb";
import { Whiteboard } from "@/models";
import { getCurrentSession, getTenantQueryFilter } from "@/server/auth/session";
import { serializeDocs } from "@/lib/serialize";
import WhiteboardsDashboardClient from "@/components/whiteboard/WhiteboardsDashboardClient";
import { ORG_CHART_NODES, ORG_CHART_EDGES } from "@/lib/whiteboardTemplates";

export const metadata = {
  title: "Whiteboards | TaskPMS",
  description: "Visual team collaboration whiteboards and organizational chart blueprints",
};

export default async function WhiteboardsPage() {
  await connectToDatabase();
  const session = await getCurrentSession();
  const tenantFilter = getTenantQueryFilter(session);

  let rawBoards = await Whiteboard.find(tenantFilter)
    .sort({ updatedAt: -1, createdAt: -1 })
    .lean();

  // If empty, seed default Org Chart
  if (!rawBoards || rawBoards.length === 0) {
    const authorName = session.name || session.email?.split("@")[0] || "Himesh S";
    const authorInitials = authorName
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "HS";

    try {
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
      rawBoards = [defaultBoard.toObject()];
    } catch {
      rawBoards = [
        {
          _id: "default-org-chart",
          title: "Organizational Chart",
          templateId: "org-chart",
          isFavorite: true,
          authorName: "Himesh S",
          authorInitials: "HS",
          nodes: ORG_CHART_NODES,
          edges: ORG_CHART_EDGES,
          updatedAt: new Date(),
        } as any,
      ];
    }
  }

  const whiteboards = serializeDocs(rawBoards);

  return (
    <div className="w-full h-full">
      <WhiteboardsDashboardClient
        initialWhiteboards={whiteboards as any}
        currentUserName={session.name || "User"}
      />
    </div>
  );
}
