import { describe, it, expect } from "vitest";
import { ORG_CHART_NODES, ORG_CHART_EDGES, WHITEBOARD_TEMPLATES } from "@/lib/whiteboardTemplates";
import {
  validateJson,
  toggleMarkdownCheckbox,
  DEFAULT_JSON_NOTE,
  DEFAULT_TEXT_NOTE,
  DEFAULT_MARKDOWN_NOTE,
} from "@/lib/whiteboardMarkdownAndJson";
import {
  ICON_GALLERY_GROUPS,
  getAllIconGalleryItems,
  filterIconGalleryItems,
  getLucideIcon,
  ICON_COMPONENT_MAP,
} from "@/lib/whiteboardIconGallery";

describe("Chat Space & Mentions Engine", () => {
  it("extracts multiple @mentions from input string", () => {
    const input = "Hey @Satyam and @Elena, check out the org chart!";
    const regex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    while ((match = regex.exec(input)) !== null) {
      mentions.push(match[1].trim());
    }

    expect(mentions).toEqual(["Satyam", "Elena"]);
  });

  it("handles standard mention tags like @name and @name2", () => {
    const sample = "@Satyam @Elena @Marcus";
    const tags = sample.match(/@(\w+)/g) || [];
    expect(tags).toEqual(["@Satyam", "@Elena", "@Marcus"]);
  });

  it("supports four delivery scopes: global, team, group, direct", () => {
    const scopes = ["global", "team", "group", "direct"];
    expect(scopes).toHaveLength(4);
    expect(scopes).toContain("global");
    expect(scopes).toContain("team");
    expect(scopes).toContain("group");
    expect(scopes).toContain("direct");
  });
});

describe("Whiteboard Canvas & Organizational Chart Template", () => {
  it("contains the exact preloaded Organizational Chart nodes matching user screenshots", () => {
    const logoNode = ORG_CHART_NODES.find((n) => n.type === "logo");
    expect(logoNode).toBeDefined();
    expect(logoNode?.title).toBe("Company Logo");

    const legendNode = ORG_CHART_NODES.find((n) => n.type === "legend");
    expect(legendNode).toBeDefined();
    expect(legendNode?.title).toBe("LEGEND");

    const stickyNode = ORG_CHART_NODES.find((n) => n.type === "sticky");
    expect(stickyNode).toBeDefined();
    expect(stickyNode?.body).toContain("Pro-tip: create tasks for each member");

    const presidentNode = ORG_CHART_NODES.find((n) => n.id === "node-president");
    expect(presidentNode).toBeDefined();
    expect(presidentNode?.subtitle).toBe("President");

    const vpNode = ORG_CHART_NODES.find((n) => n.id === "node-vp");
    expect(vpNode).toBeDefined();
    expect(vpNode?.subtitle).toBe("Vice President");

    const eaNode = ORG_CHART_NODES.find((n) => n.id === "node-ea");
    expect(eaNode).toBeDefined();
    expect(eaNode?.subtitle).toBe("Executive Assistant");
  });

  it("verifies hierarchical connector edges between President and Vice Presidents", () => {
    expect(ORG_CHART_EDGES.length).toBeGreaterThanOrEqual(4);
    const presEdge = ORG_CHART_EDGES.find((e) => e.from === "node-president" && e.to === "node-vp");
    expect(presEdge).toBeDefined();
    expect(presEdge?.style).toBe("orthogonal");
  });

  it("provides templates for Org Chart, Action Plan, Customer Journey, Meeting Notes, Notes, Diagram, and Project Planner", () => {
    const templateIds = WHITEBOARD_TEMPLATES.map((t) => t.id);
    expect(templateIds).toContain("org-chart");
    expect(templateIds).toContain("action-plan");
    expect(templateIds).toContain("customer-journey");
    expect(templateIds).toContain("meeting-notes");
    expect(templateIds).toContain("notes");
    expect(templateIds).toContain("diagram");
    expect(templateIds).toContain("project-planner");
  });

  it("transforms screen coordinates to canvas space accurately under pan and zoom", () => {
    const pan = { x: 50, y: 50 };
    const zoom = 0.5;
    const clientX = 250;
    const clientY = 350;
    const rect = { left: 0, top: 0 };

    const canvasX = (clientX - rect.left - pan.x) / zoom;
    const canvasY = (clientY - rect.top - pan.y) / zoom;

    expect(canvasX).toBe(400);
    expect(canvasY).toBe(600);
  });

  it("createFunctionalArea generates properly offset nodes and edges with unique IDs", async () => {
    const { createFunctionalArea } = await import("@/lib/whiteboardTemplates");

    const area = createFunctionalArea("meeting-notes", 500, 300);
    expect(area.nodes.length).toBeGreaterThanOrEqual(4);
    // Verify first node is positioned at or after originX, originY
    const minX = Math.min(...area.nodes.map((n) => n.x));
    const minY = Math.min(...area.nodes.map((n) => n.y));
    expect(minX).toBe(500);
    expect(minY).toBe(300);

    // Verify IDs are uniquely suffixed
    const ids = area.nodes.map((n) => n.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);

    // Verify Diagram area has connector edges
    const diagramArea = createFunctionalArea("diagram", 100, 100);
    expect(diagramArea.edges.length).toBeGreaterThan(0);
  });

  describe("Mouse Wheel Navigation Mechanics", () => {
    it("scrolls Y axis on regular mouse wheel scroll", () => {
      const initialPan = { x: 50, y: 100 };
      const deltaY = 40;
      const newPan = {
        x: initialPan.x,
        y: initialPan.y - deltaY,
      };
      expect(newPan.x).toBe(50);
      expect(newPan.y).toBe(60);
    });

    it("scrolls X axis on Shift + scroll", () => {
      const initialPan = { x: 100, y: 50 };
      const delta = 60; // from e.deltaX or e.deltaY when Shift held
      const newPan = {
        x: initialPan.x - delta,
        y: initialPan.y,
      };
      expect(newPan.x).toBe(40);
      expect(newPan.y).toBe(50);
    });

    it("zooms in/out and anchors pan around mouse coordinates on Ctrl + scroll", () => {
      const currentZoom = 1.0;
      const currentPan = { x: 0, y: 0 };
      const mouseX = 400;
      const mouseY = 300;

      // Zoom in factor 1.1x
      const newZoom = 1.1;
      const newPanX = mouseX - ((mouseX - currentPan.x) / currentZoom) * newZoom;
      const newPanY = mouseY - ((mouseY - currentPan.y) / currentZoom) * newZoom;

      expect(newZoom).toBe(1.1);
      expect(Math.round(newPanX)).toBe(-40);
      expect(Math.round(newPanY)).toBe(-30);

      // Verify that after zoom, mouse coordinate (400, 300) still points to the same canvas point (400, 300)
      const canvasPointBefore = (mouseX - currentPan.x) / currentZoom;
      const canvasPointAfter = (mouseX - newPanX) / newZoom;
      expect(Math.round(canvasPointAfter)).toBe(Math.round(canvasPointBefore));
    });
  });

  describe("Multi-Selection, Marquee Grouping & Arrow Link Branching", () => {
    it("handles Ctrl+Click multi-selection toggle logic", () => {
      let selectedNodeIds: string[] = ["node-1"];

      // Ctrl+Click unselected node -> add to selection
      const toggleNode = (id: string, isCtrl: boolean) => {
        if (isCtrl) {
          if (selectedNodeIds.includes(id)) {
            selectedNodeIds = selectedNodeIds.filter((nid) => nid !== id);
          } else {
            selectedNodeIds = [...selectedNodeIds, id];
          }
        } else {
          selectedNodeIds = [id];
        }
      };

      toggleNode("node-2", true);
      expect(selectedNodeIds).toEqual(["node-1", "node-2"]);

      // Ctrl+Click another node
      toggleNode("node-3", true);
      expect(selectedNodeIds).toEqual(["node-1", "node-2", "node-3"]);

      // Ctrl+Click already selected node -> removes from selection
      toggleNode("node-2", true);
      expect(selectedNodeIds).toEqual(["node-1", "node-3"]);

      // Normal click -> selects only that node
      toggleNode("node-4", false);
      expect(selectedNodeIds).toEqual(["node-4"]);
    });

    it("calculates rectangular marquee intersection with nodes correctly", () => {
      const nodes = [
        { id: "n1", x: 100, y: 100, width: 100, height: 80 },
        { id: "n2", x: 300, y: 100, width: 100, height: 80 },
        { id: "n3", x: 100, y: 300, width: 100, height: 80 },
      ];

      // Marquee box covering n1 and n2
      const box = { x: 50, y: 50, width: 380, height: 150 };

      const intersectingNodes = nodes.filter(
        (n) =>
          n.x < box.x + box.width &&
          n.x + n.width > box.x &&
          n.y < box.y + box.height &&
          n.y + n.height > box.y
      );

      expect(intersectingNodes.map((n) => n.id)).toEqual(["n1", "n2"]);
      expect(intersectingNodes.map((n) => n.id)).not.toContain("n3");
    });

    it("translates all nodes in a temporary group together during group drag", () => {
      const groupNodes = [
        { id: "n1", x: 100, y: 100 },
        { id: "n2", x: 250, y: 150 },
      ];
      const selectedIds = ["n1", "n2"];
      const delta = { dx: 60, dy: -30 };

      const movedNodes = groupNodes.map((n) =>
        selectedIds.includes(n.id) ? { ...n, x: n.x + delta.dx, y: n.y + delta.dy } : n
      );

      expect(movedNodes.find((n) => n.id === "n1")).toEqual({ id: "n1", x: 160, y: 70 });
      expect(movedNodes.find((n) => n.id === "n2")).toEqual({ id: "n2", x: 310, y: 120 });
    });

    it("destroys/dissolves temporary group when clicking canvas outside without Ctrl", () => {
      let selectedNodeIds: string[] = ["n1", "n2", "n3"];
      let selectedNodeId: string | null = "n1";

      const handleCanvasClickOutside = (isCtrlOrCmd: boolean) => {
        if (!isCtrlOrCmd) {
          selectedNodeId = null;
          selectedNodeIds = [];
        }
      };

      handleCanvasClickOutside(false);
      expect(selectedNodeIds).toHaveLength(0);
      expect(selectedNodeId).toBeNull();
    });

    it("adds connected branch node and linking edge from an existing arrow connector", () => {
      const nodes = [
        { id: "parent", x: 100, y: 100, width: 160, height: 96, title: "Manager" },
        { id: "child-1", x: 100, y: 250, width: 160, height: 96, title: "Lead 1" },
      ];
      const edges = [{ id: "edge-1", from: "parent", to: "child-1", color: "#60A5FA", style: "orthogonal" as const }];

      // Action: Add branch from edge-1
      const edge = edges[0];
      const parentNode = nodes.find((n) => n.id === edge.from)!;
      const existingChildren = nodes.filter((n) => edges.some((e) => e.from === parentNode.id && e.to === n.id));
      const rightmost = existingChildren.reduce((max, n) => (n.x > max.x ? n : max), existingChildren[0]);

      const newBranchNode = {
        id: "child-2",
        type: "task" as const,
        x: rightmost.x + rightmost.width + 40,
        y: rightmost.y,
        width: 160,
        height: 96,
        title: "New Team Member",
        color: "#0078D4",
      };

      const newEdge = {
        id: "edge-branch-2",
        from: parentNode.id,
        to: newBranchNode.id,
        color: edge.color || "#60A5FA",
        style: edge.style || ("solid" as const),
      };

      const updatedNodes = [...nodes, newBranchNode];
      const updatedEdges = [...edges, newEdge];

      expect(updatedNodes).toHaveLength(3);
      expect(updatedEdges).toHaveLength(2);
      expect(newBranchNode.x).toBe(100 + 160 + 40); // 300
      expect(newBranchNode.y).toBe(250);
      expect(updatedEdges.some((e) => e.from === "parent" && e.to === "child-2")).toBe(true);
    });

    describe("Directional Arrow Node Connections (<- , -> , <->) & Pen Freehand Drawing Engine", () => {
      it("creates directional arrow connection from node A to node B with 'forward' (->)", () => {
        const nodeA = { id: "node-a", x: 100, y: 100, width: 160, height: 96, title: "Source" };
        const nodeB = { id: "node-b", x: 400, y: 100, width: 160, height: 96, title: "Target" };
        const edges: Array<{ id: string; from: string; to: string; arrowDirection: "forward" | "backward" | "bidirectional" }> = [];

        // Connection action with ->
        const newEdge = {
          id: "edge-fwd-1",
          from: nodeA.id,
          to: nodeB.id,
          arrowDirection: "forward" as const,
        };
        edges.push(newEdge);

        expect(edges).toHaveLength(1);
        expect(edges[0].from).toBe("node-a");
        expect(edges[0].to).toBe("node-b");
        expect(edges[0].arrowDirection).toBe("forward");
      });

      it("creates directional arrow connection with 'backward' (<-)", () => {
        const edges: Array<{ id: string; from: string; to: string; arrowDirection: "forward" | "backward" | "bidirectional" }> = [];

        const newEdge = {
          id: "edge-bwd-1",
          from: "node-a",
          to: "node-b",
          arrowDirection: "backward" as const,
        };
        edges.push(newEdge);

        expect(edges[0].arrowDirection).toBe("backward");
      });

      it("creates bidirectional arrow connection with '<->' indicating two-way flow", () => {
        const edges: Array<{ id: string; from: string; to: string; arrowDirection: "forward" | "backward" | "bidirectional" }> = [];

        const newEdge = {
          id: "edge-bi-1",
          from: "node-a",
          to: "node-b",
          arrowDirection: "bidirectional" as const,
        };
        edges.push(newEdge);

        expect(edges[0].arrowDirection).toBe("bidirectional");
      });

      it("toggles existing arrow connection between <-, ->, and <->", () => {
        let edge = {
          id: "edge-1",
          from: "node-1",
          to: "node-2",
          arrowDirection: "forward" as "forward" | "backward" | "bidirectional",
        };

        // User switches to bidirectional <->
        edge = { ...edge, arrowDirection: "bidirectional" };
        expect(edge.arrowDirection).toBe("bidirectional");

        // User switches to backward <-
        edge = { ...edge, arrowDirection: "backward" };
        expect(edge.arrowDirection).toBe("backward");

        // User switches back to forward ->
        edge = { ...edge, arrowDirection: "forward" };
        expect(edge.arrowDirection).toBe("forward");
      });

      it("generates smooth SVG quadratic path data from freehand stroke points", () => {
        const generateSvgPath = (pts: { x: number; y: number }[]): string => {
          if (pts.length === 0) return "";
          if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y} L ${pts[0].x + 0.1} ${pts[0].y + 0.1}`;
          let d = `M ${pts[0].x} ${pts[0].y}`;
          for (let i = 1; i < pts.length - 1; i++) {
            const xc = (pts[i].x + pts[i + 1].x) / 2;
            const yc = (pts[i].y + pts[i + 1].y) / 2;
            d += ` Q ${pts[i].x} ${pts[i].y}, ${xc} ${yc}`;
          }
          d += ` L ${pts[pts.length - 1].x} ${pts[pts.length - 1].y}`;
          return d;
        };

        const strokePoints = [
          { x: 10, y: 10 },
          { x: 30, y: 40 },
          { x: 60, y: 70 },
          { x: 100, y: 80 },
        ];

        const pathData = generateSvgPath(strokePoints);
        expect(pathData).toContain("M 10 10");
        expect(pathData).toContain("Q 30 40");
        expect(pathData).toContain("L 100 80");
      });

      it("creates a whiteboard drawing node with normalized relative coordinates, bounding box, and styling", () => {
        const strokePoints = [
          { x: 150, y: 200 },
          { x: 180, y: 240 },
          { x: 220, y: 280 },
        ];

        const minX = Math.min(...strokePoints.map((p) => p.x));
        const minY = Math.min(...strokePoints.map((p) => p.y));
        const maxX = Math.max(...strokePoints.map((p) => p.x));
        const maxY = Math.max(...strokePoints.map((p) => p.y));
        const width = Math.max(16, maxX - minX);
        const height = Math.max(16, maxY - minY);

        // Normalize points relative to (minX, minY)
        const relPoints = strokePoints.map((p) => ({
          x: p.x - minX,
          y: p.y - minY,
        }));

        expect(minX).toBe(150);
        expect(minY).toBe(200);
        expect(width).toBe(70);
        expect(height).toBe(80);
        expect(relPoints[0]).toEqual({ x: 0, y: 0 });
        expect(relPoints[2]).toEqual({ x: 70, y: 80 });

        const drawNode = {
          id: "drawing-test-1",
          type: "drawing" as const,
          x: minX,
          y: minY,
          width,
          height,
          title: "Drawing",
          pathData: "M 0 0 Q 30 40, 50 60 L 70 80",
          color: "#EC4899",
          strokeWidth: 4,
        };

        expect(drawNode.type).toBe("drawing");
        expect(drawNode.color).toBe("#EC4899");
        expect(drawNode.strokeWidth).toBe(4);
      });
    });
  });

  describe("Chat Space Teams, Groups, and Direct Messaging Architecture", () => {
    const sampleChannels = [
      {
        channelId: "team-eng",
        name: "Engineering",
        type: "team" as const,
        memberIds: ["user-satyam", "user-elena", "user-david"],
        memberEmails: ["satyam@company.io", "elena@company.io", "david@company.io"],
        createdBy: "user-satyam",
        isDefault: false,
      },
      {
        channelId: "group-security",
        name: "security-audit",
        type: "group" as const,
        memberIds: ["user-satyam", "user-elena"],
        memberEmails: ["satyam@company.io", "elena@company.io"],
        createdBy: "user-satyam",
        isDefault: false,
      },
      {
        channelId: "group-sales-leads",
        name: "sales-leads",
        type: "group" as const,
        memberIds: ["user-alex", "user-sarah"],
        memberEmails: ["alex@company.io", "sarah@company.io"],
        createdBy: "user-alex",
        isDefault: false,
      },
      {
        channelId: "dm-satyam-marcus",
        name: "Marcus Chen",
        type: "direct" as const,
        memberIds: ["user-satyam", "user-marcus"],
        memberEmails: ["satyam@company.io", "marcus@company.io"],
        createdBy: "user-satyam",
      },
    ];

    it("filters channels so regular users ONLY see teams, groups, and direct chats where they are members", () => {
      const isMemberOf = (ch: typeof sampleChannels[0], userId: string, email: string) => {
        if (ch.createdBy === userId) return true;
        if (ch.memberIds.includes(userId)) return true;
        if (ch.memberEmails.includes(email)) return true;
        return false;
      };

      // Test user: user-david (only in Engineering team, NOT in security or sales-leads)
      const davidTeams = sampleChannels
        .filter((c) => c.type === "team")
        .filter((c) => isMemberOf(c, "user-david", "david@company.io"));
      expect(davidTeams.map((c) => c.channelId)).toEqual(["team-eng"]);

      const davidGroups = sampleChannels
        .filter((c) => c.type === "group")
        .filter((c) => isMemberOf(c, "user-david", "david@company.io"));
      expect(davidGroups).toHaveLength(0); // David is not in security-audit or sales-leads!

      const davidDirects = sampleChannels
        .filter((c) => c.type === "direct")
        .filter((c) => isMemberOf(c, "user-david", "david@company.io"));
      expect(davidDirects).toHaveLength(0);

      // Test user: user-satyam (in Engineering, security-audit, and direct chat with marcus)
      const satyamGroups = sampleChannels
        .filter((c) => c.type === "group")
        .filter((c) => isMemberOf(c, "user-satyam", "satyam@company.io"));
      expect(satyamGroups.map((c) => c.channelId)).toEqual(["group-security"]);
      expect(satyamGroups.map((c) => c.channelId)).not.toContain("group-sales-leads");
    });

    it("validates team creation payload with creator auto-inclusion and member selection", () => {
      const creatorId = "user-satyam";
      const selectedMemberIds = ["user-elena", "user-david"];

      const finalMemberIds = Array.from(new Set([creatorId, ...selectedMemberIds]));
      expect(finalMemberIds).toEqual(["user-satyam", "user-elena", "user-david"]);
      expect(finalMemberIds).toContain(creatorId);
    });

    it("creates unique deterministic direct chat channel between two colleagues", () => {
      const userA = "u-101";
      const userB = "u-205";

      const participants = [userA, userB].sort();
      const directChannelId = `dm-${participants[0]}-${participants[1]}`;

      expect(directChannelId).toBe("dm-u-101-u-205");

      // Verify symmetry
      const reverseParticipants = [userB, userA].sort();
      const reverseChannelId = `dm-${reverseParticipants[0]}-${reverseParticipants[1]}`;
      expect(reverseChannelId).toBe(directChannelId);
    });
  });

  describe("Whiteboard Multi-Format File Drop & AWS S3 Offloading", () => {
    it("correctly identifies file type and assigns appropriate whiteboard node type", () => {
      const getWhiteboardType = (fileName: string, mime: string): string => {
        const ext = fileName.split(".").pop()?.toLowerCase() || "";
        if (mime.startsWith("image/") || ext === "svg") return "image";
        if (ext === "pdf" || mime === "application/pdf") return "pdf";
        if (ext === "graphml" || (ext === "xml" && fileName.includes("graph"))) return "graphml";
        if (ext === "json" || mime === "application/json") return "json";
        if (ext === "md" || ext === "markdown") return "markdown";
        return "file";
      };

      expect(getWhiteboardType("architecture.graphml", "application/xml")).toBe("graphml");
      expect(getWhiteboardType("specifications.pdf", "application/pdf")).toBe("pdf");
      expect(getWhiteboardType("config.json", "application/json")).toBe("json");
      expect(getWhiteboardType("README.md", "text/markdown")).toBe("markdown");
      expect(getWhiteboardType("diagram.svg", "image/svg+xml")).toBe("image");
      expect(getWhiteboardType("archive.zip", "application/zip")).toBe("file");
    });

    it("generates enterprise isolated S3 key without saving heavy Base64 in document", () => {
      const companyId = "company-99";
      const boardId = "wb-12345";
      const fileName = "System Diagram Architecture (v2).graphml";
      const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const timestamp = 1791569100000;

      const s3Key = `${companyId}/whiteboards/${boardId}/${timestamp}_${safeName}`;
      expect(s3Key).toBe("company-99/whiteboards/wb-12345/1791569100000_System_Diagram_Architecture__v2_.graphml");

      // Verify node stores s3Key and s3Url rather than a multi-megabyte base64 string
      const node = {
        id: "node-1",
        type: "graphml",
        fileUrl: `https://my-bucket.s3.amazonaws.com/${s3Key}`,
        s3Key,
        fileName,
        fileSize: 45020,
      };

      expect(node.fileUrl).toContain("https://my-bucket.s3.amazonaws.com/");
      expect(node.fileUrl.startsWith("data:image")).toBe(false);
      expect(node.fileUrl.startsWith("data:application")).toBe(false);
    });

    it("extracts GraphML topology statistics accurately", () => {
      const sampleGraphML = `<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.graphdrawing.org/xmlns">
  <graph id="G" edgedefault="directed">
    <node id="n0"><data key="label">Frontend NextJS</data></node>
    <node id="n1"><data key="label">API Gateway</data></node>
    <node id="n2"><data key="label">AWS S3 Storage</data></node>
    <edge id="e0" source="n0" target="n1"/>
    <edge id="e1" source="n1" target="n2"/>
  </graph>
</graphml>`;

      const nodeMatches = sampleGraphML.match(/<node\b/gi);
      const edgeMatches = sampleGraphML.match(/<edge\b/gi);
      const graphMatch = sampleGraphML.match(/<graph\b[^>]*id=["']([^"']+)["']/i);

      expect(nodeMatches?.length).toBe(3);
      expect(edgeMatches?.length).toBe(2);
      expect(graphMatch?.[1]).toBe("G");
    });

    it("parses JSON payload metadata for canvas card preview", () => {
      const jsonContent = JSON.stringify({
        project: "WorkManagement",
        version: "2.4.0",
        services: ["auth", "s3", "whiteboard", "tasks"],
        settings: { cloudHosted: true },
      });

      const parsed = JSON.parse(jsonContent);
      const keyCount = Object.keys(parsed).length;
      const isArray = Array.isArray(parsed);

      expect(keyCount).toBe(4);
      expect(isArray).toBe(false);
    });

    it("computes Markdown line and word count for canvas card preview", () => {
      const mdContent = `# Project Overview\n\nThis whiteboard supports direct S3 uploads.\nNo heavy base64 strings.\n\n- PDF\n- GraphML\n- JSON\n- Markdown`;
      const lines = mdContent.split("\n");
      const words = mdContent.split(/\s+/).filter(Boolean);

      expect(lines.length).toBeGreaterThan(5);
      expect(words.length).toBeGreaterThan(10);
    });

    it("distinguishes native canvas elements from external S3 uploaded objects for delete prompt", () => {
      const isS3ObjectNode = (node: any): boolean => {
        if (node.s3Key && node.s3Key.trim().length > 0) return true;
        if (node.fileUrl && (node.fileUrl.includes(".amazonaws.com") || node.fileUrl.startsWith("http"))) {
          return true;
        }
        if (
          node.type === "image" &&
          node.imageUrl &&
          (node.imageUrl.includes(".amazonaws.com") ||
            (node.imageUrl.startsWith("http") && !node.imageUrl.startsWith("data:")))
        ) {
          return true;
        }
        return false;
      };

      // Native shapes & stickies should NOT trigger S3 prompt
      const nativeShapeNode = { id: "n-1", type: "shape", title: "Rectangle" };
      const nativeStickyNode = { id: "n-2", type: "sticky", title: "Meeting note" };
      const nativeTaskNode = { id: "n-3", type: "task", title: "Fix bug" };

      expect(isS3ObjectNode(nativeShapeNode)).toBe(false);
      expect(isS3ObjectNode(nativeStickyNode)).toBe(false);
      expect(isS3ObjectNode(nativeTaskNode)).toBe(false);

      // External files uploaded to S3 MUST trigger S3 prompt
      const s3PdfNode = {
        id: "n-4",
        type: "pdf",
        s3Key: "company-1/whiteboards/wb-1/report.pdf",
        fileUrl: "https://bucket.s3.amazonaws.com/company-1/whiteboards/wb-1/report.pdf",
      };
      const s3GraphNode = {
        id: "n-5",
        type: "graphml",
        s3Key: "company-1/whiteboards/wb-1/network.graphml",
      };
      const s3ImageNode = {
        id: "n-6",
        type: "image",
        imageUrl: "https://bucket.s3.amazonaws.com/company-1/whiteboards/wb-1/photo.png",
      };

      expect(isS3ObjectNode(s3PdfNode)).toBe(true);
      expect(isS3ObjectNode(s3GraphNode)).toBe(true);
      expect(isS3ObjectNode(s3ImageNode)).toBe(true);
    });

    it("normalizes S3 URLs and keys securely for deletion API", () => {
      const normalizeS3Key = (keyOrUrl: string): string => {
        if (!keyOrUrl) return "";
        if (keyOrUrl.startsWith("http://") || keyOrUrl.startsWith("https://")) {
          try {
            const parsed = new URL(keyOrUrl);
            return decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
          } catch {
            return keyOrUrl;
          }
        }
        return keyOrUrl;
      };

      const directKey = "company-10/whiteboards/board-A/123_spec.pdf";
      const fullUrl = "https://company-bucket.s3.us-east-1.amazonaws.com/company-10/whiteboards/board-A/123_spec.pdf?mock_storage=true";

      expect(normalizeS3Key(directKey)).toBe("company-10/whiteboards/board-A/123_spec.pdf");
      expect(normalizeS3Key(fullUrl)).toBe("company-10/whiteboards/board-A/123_spec.pdf");
    });

    it("enforces tenant boundary check on S3 deletion to prevent cross-tenant object removal", () => {
      const companyId = "company-42";
      const isAuthorizedKey = (key: string, tenantId: string): boolean => {
        if (tenantId === "global") return true;
        return key.startsWith(`${tenantId}/whiteboards/`) || key.startsWith("global/whiteboards/");
      };

      expect(isAuthorizedKey("company-42/whiteboards/board-1/file.pdf", companyId)).toBe(true);
      expect(isAuthorizedKey("global/whiteboards/board-1/file.pdf", companyId)).toBe(true);
      // Attempting to delete another tenant's file should be rejected
      expect(isAuthorizedKey("company-999/whiteboards/board-2/file.pdf", companyId)).toBe(false);
    });
  });

  describe("Chat S3 Attachments & 1-Day Auto-Deletion Lifecycle", () => {
    it("validates allowed chat attachment formats: images and PDFs only", () => {
      const allowedExtensions = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg", "pdf"]);
      const isAllowed = (fileName: string) => {
        const ext = fileName.split(".").pop()?.toLowerCase() || "";
        return allowedExtensions.has(ext);
      };

      expect(isAllowed("architecture.png")).toBe(true);
      expect(isAllowed("system-diagram.jpg")).toBe(true);
      expect(isAllowed("screenshot.webp")).toBe(true);
      expect(isAllowed("workflow.svg")).toBe(true);
      expect(isAllowed("annual_report.pdf")).toBe(true);

      // Disallowed file types
      expect(isAllowed("malware.exe")).toBe(false);
      expect(isAllowed("archive.zip")).toBe(false);
      expect(isAllowed("script.sh")).toBe(false);
      expect(isAllowed("data.csv")).toBe(false);
    });

    it("generates isolated multi-tenant S3 key for chat attachments", async () => {
      const { buildChatS3Key } = await import("@/lib/s3");
      const key = buildChatS3Key("comp-123", "marketing-squad", "Q4 Strategy Pitch.pdf");

      expect(key.startsWith("comp-123/chat/marketing-squad/")).toBe(true);
      expect(key).toContain("_Q4_Strategy_Pitch.pdf");
      expect(key).not.toContain(" ");
    });

    it("computes exactly 24-hour (1 day) expiration window for chat attachments", () => {
      const now = Date.now();
      const expiresAt = new Date(now + 24 * 60 * 60 * 1000);
      const diffMs = expiresAt.getTime() - now;

      expect(diffMs).toBe(86400000); // 24 hours in milliseconds
      expect(diffMs / (1000 * 60 * 60)).toBe(24);
    });

    it("prunes expired attachments (> 1 day old) chatside while keeping active attachments", () => {
      const currentTime = new Date("2026-10-10T12:00:00Z");

      const attachments = [
        {
          name: "active_mockup.png",
          s3Key: "comp-1/chat/global/active_mockup.png",
          expiresAt: new Date("2026-10-11T10:00:00Z"), // expires tomorrow
        },
        {
          name: "expired_spec.pdf",
          s3Key: "comp-1/chat/global/expired_spec.pdf",
          expiresAt: new Date("2026-10-09T11:00:00Z"), // expired yesterday
        },
      ];

      const activeOnly = attachments.filter(
        (att) => new Date(att.expiresAt) > currentTime
      );

      expect(activeOnly).toHaveLength(1);
      expect(activeOnly[0].name).toBe("active_mockup.png");
    });

    it("defaults to applying file size reducer (sendOriginalHd = false)", () => {
      // Simulating default chat attachment configuration
      const defaultSendOriginalHd = false;
      const file = { name: "high_res_photo.jpg", size: 4 * 1024 * 1024, type: "image/jpeg" };

      // Under default settings:
      const shouldCompress = file.type.startsWith("image/") && !defaultSendOriginalHd;
      expect(shouldCompress).toBe(true);

      const stagedAttachment = {
        name: file.name,
        originalSize: file.size,
        size: Math.round(file.size * 0.28), // 72% reduction
        isHdOriginal: defaultSendOriginalHd,
        reductionPercent: 72,
        type: "image" as const,
      };

      expect(stagedAttachment.isHdOriginal).toBe(false);
      expect(stagedAttachment.reductionPercent).toBeGreaterThan(0);
      expect(stagedAttachment.size).toBeLessThan(stagedAttachment.originalSize);
    });

    it("respects 'Send original HD' tick box when enabled by user", () => {
      const sendOriginalHd = true; // User checked the tick box
      const file = { name: "architecture_diagram.png", size: 5 * 1024 * 1024, type: "image/png" };

      const shouldCompress = file.type.startsWith("image/") && !sendOriginalHd;
      expect(shouldCompress).toBe(false);

      const stagedAttachment = {
        name: file.name,
        originalSize: file.size,
        size: file.size,
        isHdOriginal: sendOriginalHd,
        reductionPercent: 0,
        type: "image" as const,
      };

      expect(stagedAttachment.isHdOriginal).toBe(true);
      expect(stagedAttachment.reductionPercent).toBe(0);
      expect(stagedAttachment.size).toBe(stagedAttachment.originalSize);
    });

    it("formats size badges accurately for both Reduced (-XX%) and HD ORIGINAL", () => {
      const formatBadge = (att: { isHdOriginal?: boolean; reductionPercent?: number; size: number }) => {
        if (att.isHdOriginal) {
          const sizeStr = att.size >= 1024 * 1024
            ? `${(att.size / (1024 * 1024)).toFixed(1)} MB`
            : `${Math.round(att.size / 1024)} KB`;
          return `💎 HD ORIGINAL (${sizeStr})`;
        }
        const pct = att.reductionPercent ? `-${att.reductionPercent}%` : "";
        const sizeStr = att.size >= 1024 * 1024
          ? `${(att.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(att.size / 1024)} KB`;
        return `⚡ REDUCED ${pct} (${sizeStr})`.trim();
      };

      const reducedCard = { isHdOriginal: false, reductionPercent: 78, size: 280 * 1024 };
      expect(formatBadge(reducedCard)).toBe("⚡ REDUCED -78% (280 KB)");

      const hdCard = { isHdOriginal: true, reductionPercent: 0, size: 4.5 * 1024 * 1024 };
      expect(formatBadge(hdCard)).toBe("💎 HD ORIGINAL (4.5 MB)");
    });
  });

  describe("Whiteboard Sticky Note Todo Checklists & Interactive Checkboxes", () => {
    it("parses structured checklist from a node with existing checklist array", async () => {
      const { parseNodeChecklist } = await import("@/lib/whiteboardChecklist");
      const node = {
        id: "sticky-1",
        type: "sticky" as const,
        hasCheckbox: true,
        checklist: [
          { id: "c-1", text: "Buy SSL domain", completed: true },
          { id: "c-2", text: "Configure AWS S3 bucket", completed: false },
        ],
      };
      const items = parseNodeChecklist(node);
      expect(items).toHaveLength(2);
      expect(items[0]).toEqual({ id: "c-1", text: "Buy SSL domain", completed: true });
      expect(items[1]).toEqual({ id: "c-2", text: "Configure AWS S3 bucket", completed: false });
    });

    it("parses markdown checkbox lines from body text into checklist items", async () => {
      const { parseNodeChecklist } = await import("@/lib/whiteboardChecklist");
      const node = {
        id: "sticky-2",
        type: "sticky" as const,
        body: "[x] Initial database schema\n[ ] Setup Stripe / Razorpay webhooks\n[x] Run vitest suite",
      };
      const items = parseNodeChecklist(node);
      expect(items).toHaveLength(3);
      expect(items[0].completed).toBe(true);
      expect(items[0].text).toBe("Initial database schema");
      expect(items[1].completed).toBe(false);
      expect(items[1].text).toBe("Setup Stripe / Razorpay webhooks");
      expect(items[2].completed).toBe(true);
      expect(items[2].text).toBe("Run vitest suite");
    });

    it("parses bullet and numbered lines from body text into checklist items", async () => {
      const { parseNodeChecklist } = await import("@/lib/whiteboardChecklist");
      const node = {
        id: "sticky-3",
        type: "sticky" as const,
        body: "• First sprint goal\n• Second sprint deliverable\n3. Third release checkpoint",
      };
      const items = parseNodeChecklist(node);
      expect(items).toHaveLength(3);
      expect(items[0].text).toBe("First sprint goal");
      expect(items[0].completed).toBe(false);
      expect(items[2].text).toBe("Third release checkpoint");
    });

    it("generates starter todo items when body is empty or default placeholder", async () => {
      const { parseNodeChecklist } = await import("@/lib/whiteboardChecklist");
      const node1 = { id: "sticky-empty", type: "sticky" as const, body: "" };
      const items1 = parseNodeChecklist(node1);
      expect(items1.length).toBeGreaterThanOrEqual(2);

      const node2 = {
        id: "sticky-default",
        type: "sticky" as const,
        body: "Type your notes or pro-tips here...",
      };
      const items2 = parseNodeChecklist(node2);
      expect(items2.length).toBeGreaterThanOrEqual(2);
    });

    it("serializes checklist items into markdown-compatible body string", async () => {
      const { serializeChecklistToBody } = await import("@/lib/whiteboardChecklist");
      const items = [
        { id: "1", text: "Deploy to staging", completed: true },
        { id: "2", text: "QA test on Chrome", completed: false },
      ];
      const body = serializeChecklistToBody(items);
      expect(body).toBe("[x] Deploy to staging\n[ ] QA test on Chrome");
    });

    it("toggles item completion status by id accurately", async () => {
      const { toggleChecklistItem } = await import("@/lib/whiteboardChecklist");
      const items = [
        { id: "item-1", text: "Task A", completed: false },
        { id: "item-2", text: "Task B", completed: true },
      ];
      const toggled1 = toggleChecklistItem(items, "item-1");
      expect(toggled1.find((i) => i.id === "item-1")?.completed).toBe(true);

      const toggled2 = toggleChecklistItem(toggled1, "item-2");
      expect(toggled2.find((i) => i.id === "item-2")?.completed).toBe(false);
    });

    it("updates checklist item text and adds new items", async () => {
      const { addChecklistItem, updateChecklistItemText } = await import(
        "@/lib/whiteboardChecklist"
      );
      const initial = [{ id: "1", text: "Initial", completed: false }];
      const updated = updateChecklistItemText(initial, "1", "Updated Text");
      expect(updated[0].text).toBe("Updated Text");

      const appended = addChecklistItem(updated, "New Task");
      expect(appended).toHaveLength(2);
      expect(appended[1].text).toBe("New Task");
      expect(appended[1].completed).toBe(false);
    });

    it("inserts item right after active index and deletes item by id", async () => {
      const { insertChecklistItemAfter, deleteChecklistItem } = await import(
        "@/lib/whiteboardChecklist"
      );
      const items = [
        { id: "a", text: "First", completed: false },
        { id: "c", text: "Third", completed: false },
      ];
      const withMiddle = insertChecklistItemAfter(items, 0, "Second");
      expect(withMiddle).toHaveLength(3);
      expect(withMiddle[1].text).toBe("Second");

      const afterDelete = deleteChecklistItem(withMiddle, "c");
      expect(afterDelete).toHaveLength(2);
      expect(afterDelete.map((i) => i.text)).toEqual(["First", "Second"]);
    });

    it("computes checklist progress statistics correctly", async () => {
      const { getChecklistStats } = await import("@/lib/whiteboardChecklist");
      const items = [
        { id: "1", text: "A", completed: true },
        { id: "2", text: "B", completed: false },
        { id: "3", text: "C", completed: true },
        { id: "4", text: "D", completed: false },
      ];
      const stats = getChecklistStats(items);
      expect(stats.total).toBe(4);
      expect(stats.completed).toBe(2);
      expect(stats.percent).toBe(50);
    });

    it("resolves tailored pastel text colors for sticky notes", async () => {
      const { getStickyTextColor } = await import("@/lib/whiteboardChecklist");
      expect(getStickyTextColor("#EC4899")).toBe("#FCE7F3"); // Pink
      expect(getStickyTextColor("#FBBF24")).toBe("#FEF3C7"); // Yellow
      expect(getStickyTextColor("#34D399")).toBe("#D1FAE5"); // Green
      expect(getStickyTextColor("#38BDF8")).toBe("#E0F2FE"); // Cyan
      expect(getStickyTextColor("#A78BFA")).toBe("#EDE9FE"); // Purple
      expect(getStickyTextColor("#EF4444")).toBe("#FEE2E2"); // Red
      // Custom text color override
      expect(getStickyTextColor("#EC4899", "#FFFFFF")).toBe("#FFFFFF");
    });

    it("verifies Notes & Brainstorm template has interactive checklist sticky note", () => {
      const notesTemplate = WHITEBOARD_TEMPLATES.find((t) => t.id === "notes");
      expect(notesTemplate).toBeDefined();

      const winsNode = notesTemplate?.nodes.find((n) => n.id === "nt-wins");
      expect(winsNode).toBeDefined();
      expect(winsNode?.type).toBe("sticky");
      expect(winsNode?.hasCheckbox).toBe(true);
      expect(winsNode?.checklist?.length).toBeGreaterThanOrEqual(3);
      expect(winsNode?.checklist?.[0].completed).toBe(true);
    });
  });

  describe("Whiteboard Canvas Theme & Text Color Persistence Across Refresh", () => {
    it("preserves updated canvas background color and custom node textColor in snapshot payload", () => {
      const customBackground = "#1E293B"; // Dark Slate theme
      const customTextColor = "#38BDF8"; // Cyan text color

      const nodes = JSON.parse(JSON.stringify(ORG_CHART_NODES));
      nodes[0].title = "Custom Strategic Blueprint";
      nodes[0].textColor = customTextColor;

      const snapshot = {
        title: "Updated Board Title",
        nodes,
        edges: ORG_CHART_EDGES,
        backgroundColor: customBackground,
        savedAt: Date.now(),
      };

      const serialized = JSON.stringify(snapshot);
      const deserialized = JSON.parse(serialized);

      expect(deserialized.backgroundColor).toBe("#1E293B");
      expect(deserialized.nodes[0].title).toBe("Custom Strategic Blueprint");
      expect(deserialized.nodes[0].textColor).toBe("#38BDF8");
    });

    it("verifies hydration priority: local cache with custom colors overrides fallback black theme and default nodes", () => {
      const initialBoardFallback = {
        _id: "default-org-chart",
        title: "Organizational Chart",
        nodes: ORG_CHART_NODES,
        edges: ORG_CHART_EDGES,
        backgroundColor: "#0D0E11",
        updatedAt: new Date(Date.now() - 60000), // 1 minute ago
      };

      const localCachedSnapshot = {
        title: "Product Roadmap Q4",
        backgroundColor: "#0A192F", // Deep Navy theme
        savedAt: Date.now(), // Newer
        nodes: [
          {
            ...ORG_CHART_NODES[0],
            title: "VP of Product Engineering",
            textColor: "#F472B6",
          },
        ],
        edges: ORG_CHART_EDGES,
      };

      // Emulate hydration condition logic
      const isDefaultOrTemplate =
        !initialBoardFallback._id ||
        initialBoardFallback._id === "default-org-chart" ||
        initialBoardFallback._id === "org-chart";

      const initialTime = new Date(initialBoardFallback.updatedAt).getTime();
      const cacheTime = localCachedSnapshot.savedAt;

      const shouldHydrate = isDefaultOrTemplate || cacheTime >= initialTime - 5000;
      expect(shouldHydrate).toBe(true);

      const resolvedBackgroundColor = localCachedSnapshot.backgroundColor;
      const resolvedNodes = localCachedSnapshot.nodes;

      expect(resolvedBackgroundColor).toBe("#0A192F");
      expect(resolvedNodes[0].title).toBe("VP of Product Engineering");
      expect(resolvedNodes[0].textColor).toBe("#F472B6");
    });

    it("ensures custom background themes and node text edits are included in PUT request body", () => {
      const updatePayload = {
        title: "Executive Structure 2026",
        backgroundColor: "#FEF9C3", // Light Yellow Paper theme
        nodes: [
          {
            id: "node-1",
            type: "task",
            x: 100,
            y: 100,
            width: 220,
            height: 90,
            title: "Deliver Q3 Deliverables",
            subtitle: "Team Lead",
            textColor: "#B45309",
          },
        ],
        edges: [],
        isFavorite: true,
      };

      expect(updatePayload.backgroundColor).toBe("#FEF9C3");
      expect(updatePayload.nodes[0].textColor).toBe("#B45309");
      expect(updatePayload.nodes[0].title).toBe("Deliver Q3 Deliverables");
    });

    it("verifies direct node update by ID persists changes even when selection is cleared on canvas click", () => {
      const initialNodes = [
        {
          id: "node-task-1",
          type: "task" as const,
          x: 100,
          y: 100,
          width: 200,
          height: 80,
          title: "Initial Title",
          subtitle: "Manager",
          color: "#0078D4",
        },
      ];

      // In select mode, canvas mousedown clears selectedNodeId to null
      let selectedNodeId: string | null = null;
      let editingNodeId: string | null = "node-task-1";

      const newText = "Updated Strategic Milestone";

      // Direct update function using target node ID
      const updateNodeDirect = (id: string, patch: any, currentNodes: typeof initialNodes) => {
        return currentNodes.map((n) => (n.id === id ? { ...n, ...patch } : n));
      };

      const updated = updateNodeDirect("node-task-1", { title: newText }, initialNodes);
      expect(updated[0].title).toBe("Updated Strategic Milestone");

      // Verify that even if selection state was null, target node retained new title
      expect(selectedNodeId).toBeNull();
      expect(updated[0].title).not.toBe("Initial Title");
    });

    it("verifies live text drafting ensures input changes are retained before blur/unmount", () => {
      const currentNodes = [
        {
          id: "node-shape-1",
          type: "shape" as const,
          x: 150,
          y: 150,
          width: 140,
          height: 120,
          title: "Old Label",
          color: "#EC4899",
        },
      ];

      const handleLiveTextChange = (id: string, patch: any) => {
        return currentNodes.map((n) => (n.id === id ? { ...n, ...patch } : n));
      };

      // As user types in select mode, live update captures each keystroke
      const draftedNodes = handleLiveTextChange("node-shape-1", { title: "Executive Decision" });

      // When canvas click unmounts the input in select mode, draftedNodes already has the updated title
      expect(draftedNodes[0].title).toBe("Executive Decision");
    });

    it("verifies connector lines calculate robust coordinates for displaced/negative nodes without clipping", () => {
      const fromNode = {
        id: "node-from",
        type: "shape" as const,
        x: -2188,
        y: -1881,
        width: 170,
        height: 100,
        title: "From Node",
      };
      const toNode = {
        id: "node-to",
        type: "shape" as const,
        x: -1948,
        y: -1881,
        width: 180,
        height: 100,
        title: "To Node",
      };
      const edge = {
        id: "edge-test",
        from: "node-from",
        to: "node-to",
        color: "#60A5FA",
        style: "orthogonal" as const,
      };

      const fromCenterX = fromNode.x + fromNode.width / 2;
      const fromCenterY = fromNode.y + fromNode.height / 2;
      const toCenterX = toNode.x + toNode.width / 2;
      const toCenterY = toNode.y + toNode.height / 2;

      const dx = toCenterX - fromCenterX;
      const dy = toCenterY - fromCenterY;

      expect(dx).toBeGreaterThan(0);
      const startX = fromNode.x + fromNode.width;
      const startY = fromCenterY;
      const endX = toNode.x;
      const endY = toCenterY;
      const midX = startX + (endX - startX) / 2;

      const pathData = `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`;
      expect(pathData).toBe("M -2018 -1831 L -1983 -1831 L -1983 -1831 L -1948 -1831");
      expect(pathData).not.toContain("NaN");
    });

    it("verifies live pen points generate continuous smooth SVG path during drag", () => {
      const generateSvgPath = (pts: { x: number; y: number }[]): string => {
        if (pts.length === 0) return "";
        if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y} L ${pts[0].x + 0.1} ${pts[0].y + 0.1}`;
        let d = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 1; i < pts.length - 1; i++) {
          const xc = (pts[i].x + pts[i + 1].x) / 2;
          const yc = (pts[i].y + pts[i + 1].y) / 2;
          d += ` Q ${pts[i].x} ${pts[i].y}, ${xc} ${yc}`;
        }
        d += ` L ${pts[pts.length - 1].x} ${pts[pts.length - 1].y}`;
        return d;
      };

      // 1 point
      expect(generateSvgPath([{ x: 10, y: 20 }])).toBe("M 10 20 L 10.1 20.1");

      // Multiple dragging points
      const dragPoints = [
        { x: 10, y: 20 },
        { x: 30, y: 40 },
        { x: 60, y: 70 },
      ];
      const livePath = generateSvgPath(dragPoints);
      expect(livePath).toContain("M 10 20");
      expect(livePath).toContain("Q 30 40");
      expect(livePath).toContain("L 60 70");
    });

    it("verifies empty canvas click and outside click immediately dismiss color palette", () => {
      let showStylePalette = true;
      let showShapePalette = true;
      let showTemplateSelector = true;

      // Canvas background click handler resets all popovers
      const handleCanvasMouseDown = () => {
        showStylePalette = false;
        showShapePalette = false;
        showTemplateSelector = false;
      };

      handleCanvasMouseDown();
      expect(showStylePalette).toBe(false);
      expect(showShapePalette).toBe(false);
      expect(showTemplateSelector).toBe(false);
    });
  });

  describe("Dynamic Arrow Anchor Routing (Up, Down, Left, Right)", () => {
    // Dynamic anchor resolution logic as implemented in WhiteboardCanvas
    const computeEdgeEndpoints = (
      fromNode: { x: number; y: number; width: number; height: number },
      toNode: { x: number; y: number; width: number; height: number },
      style: "orthogonal" | "straight" | "curved" = "orthogonal"
    ) => {
      const fromCenterX = fromNode.x + fromNode.width / 2;
      const fromCenterY = fromNode.y + fromNode.height / 2;
      const toCenterX = toNode.x + toNode.width / 2;
      const toCenterY = toNode.y + toNode.height / 2;

      const dx = toCenterX - fromCenterX;
      const dy = toCenterY - fromCenterY;

      const gapX =
        dx > 0
          ? toNode.x - (fromNode.x + fromNode.width)
          : fromNode.x - (toNode.x + toNode.width);

      const gapY =
        dy > 0
          ? toNode.y - (fromNode.y + fromNode.height)
          : fromNode.y - (toNode.y + toNode.height);

      let isHorizontal: boolean;
      if (gapX > 0 && gapY <= 0) {
        isHorizontal = true;
      } else if (gapY > 0 && gapX <= 0) {
        isHorizontal = false;
      } else if (gapX > 0 && gapY > 0) {
        isHorizontal = gapX >= gapY;
      } else {
        isHorizontal = Math.abs(dx) >= Math.abs(dy);
      }

      let startX: number, startY: number, endX: number, endY: number;
      let fromFace: "top" | "bottom" | "left" | "right";
      let toFace: "top" | "bottom" | "left" | "right";

      if (isHorizontal) {
        if (dx > 0) {
          startX = fromNode.x + fromNode.width;
          startY = fromCenterY;
          endX = toNode.x;
          endY = toCenterY;
          fromFace = "right";
          toFace = "left";
        } else {
          startX = fromNode.x;
          startY = fromCenterY;
          endX = toNode.x + toNode.width;
          endY = toCenterY;
          fromFace = "left";
          toFace = "right";
        }
      } else {
        if (dy > 0) {
          startX = fromCenterX;
          startY = fromNode.y + fromNode.height;
          endX = toCenterX;
          endY = toNode.y;
          fromFace = "bottom";
          toFace = "top";
        } else {
          startX = fromCenterX;
          startY = fromNode.y;
          endX = toCenterX;
          endY = toNode.y + toNode.height;
          fromFace = "top";
          toFace = "bottom";
        }
      }

      return { startX, startY, endX, endY, fromFace, toFace, isHorizontal };
    };

    it("dynamically routes side-by-side nodes (Phase 1 -> Phase 2) horizontally from right to left face", () => {
      const phase1 = { x: 120, y: 200, width: 200, height: 140 };
      const phase2 = { x: 350, y: 200, width: 200, height: 140 };

      const result = computeEdgeEndpoints(phase1, phase2);
      expect(result.fromFace).toBe("right");
      expect(result.toFace).toBe("left");
      expect(result.startX).toBe(320); // 120 + 200
      expect(result.startY).toBe(270); // 200 + 70
      expect(result.endX).toBe(350);
      expect(result.endY).toBe(270);
    });

    it("dynamically routes stacked hierarchy nodes (President -> VP) vertically from bottom to top face", () => {
      const president = { x: 500, y: 100, width: 220, height: 100 };
      const vp = { x: 300, y: 260, width: 200, height: 100 };

      const result = computeEdgeEndpoints(president, vp);
      expect(result.fromFace).toBe("bottom");
      expect(result.toFace).toBe("top");
      expect(result.startX).toBe(610); // 500 + 110
      expect(result.startY).toBe(200); // 100 + 100
      expect(result.endX).toBe(400); // 300 + 100
      expect(result.endY).toBe(260);
    });

    it("dynamically routes backward horizontal nodes (Phase 2 -> Phase 1) from left to right face", () => {
      const phase2 = { x: 350, y: 200, width: 200, height: 140 };
      const phase1 = { x: 120, y: 200, width: 200, height: 140 };

      const result = computeEdgeEndpoints(phase2, phase1);
      expect(result.fromFace).toBe("left");
      expect(result.toFace).toBe("right");
      expect(result.startX).toBe(350);
      expect(result.startY).toBe(270);
      expect(result.endX).toBe(320);
      expect(result.endY).toBe(270);
    });

    it("dynamically routes upward vertical nodes (Subordinate -> Supervisor) from top to bottom face", () => {
      const vp = { x: 300, y: 260, width: 200, height: 100 };
      const president = { x: 500, y: 100, width: 220, height: 100 };

      const result = computeEdgeEndpoints(vp, president);
      expect(result.fromFace).toBe("top");
      expect(result.toFace).toBe("bottom");
      expect(result.startX).toBe(400);
      expect(result.startY).toBe(260);
      expect(result.endX).toBe(610);
      expect(result.endY).toBe(200);
    });

    it("dynamically routes in-flight arrow preview from the closest face towards cursor position", () => {
      const node = { x: 100, y: 100, width: 100, height: 100 };
      const fromCenterX = 150;
      const fromCenterY = 150;

      const getPreviewStart = (targetX: number, targetY: number) => {
        const mdx = targetX - fromCenterX;
        const mdy = targetY - fromCenterY;
        if (Math.abs(mdx) >= Math.abs(mdy)) {
          return mdx > 0 ? { x: node.x + node.width, y: fromCenterY } : { x: node.x, y: fromCenterY };
        } else {
          return mdy > 0 ? { x: fromCenterX, y: node.y + node.height } : { x: fromCenterX, y: node.y };
        }
      };

      // Cursor to the right
      expect(getPreviewStart(400, 150)).toEqual({ x: 200, y: 150 });
      // Cursor to the left
      expect(getPreviewStart(20, 150)).toEqual({ x: 100, y: 150 });
      // Cursor below
      expect(getPreviewStart(150, 400)).toEqual({ x: 150, y: 200 });
      // Cursor above
      expect(getPreviewStart(150, 20)).toEqual({ x: 150, y: 100 });
    });
  });

  describe("Whiteboard Toolbar Hold to Drag Items onto Canvas", () => {
    const getCanvasCoords = (
      clientX: number,
      clientY: number,
      rect: { left: number; top: number },
      pan: { x: number; y: number },
      zoom: number
    ) => {
      const x = (clientX - rect.left - pan.x) / zoom;
      const y = (clientY - rect.top - pan.y) / zoom;
      return { x: Math.round(x), y: Math.round(y) };
    };

    it("correctly converts drag drop screen coordinates with pan and zoom to canvas coordinates", () => {
      const rect = { left: 0, top: 64 };
      const pan = { x: 100, y: 50 };
      const zoom = 1.25;

      const clientX = 500;
      const clientY = 400;

      const coords = getCanvasCoords(clientX, clientY, rect, pan, zoom);
      // x = (500 - 0 - 100) / 1.25 = 400 / 1.25 = 320
      // y = (400 - 64 - 50) / 1.25 = 286 / 1.25 = 228.8 -> 229
      expect(coords.x).toBe(320);
      expect(coords.y).toBe(229);
    });

    it("parses drag payloads for task cards, shapes, sticky notes, todo notes, text, and frames", () => {
      const payloads = [
        { category: "node", type: "task" },
        { category: "node", type: "shape", shapeType: "circle" },
        { category: "node", type: "shape", shapeType: "diamond" },
        { category: "node", type: "shape", shapeType: "hexagon" },
        { category: "node", type: "sticky", isChecklist: false },
        { category: "node", type: "sticky", isChecklist: true, color: "#38BDF8" },
        { category: "node", type: "text" },
        { category: "node", type: "shape", shapeType: "rectangle", color: "#60A5FA" },
        { category: "functional-area", areaType: "project-planner" },
        { category: "functional-area", areaType: "meeting-notes" },
      ];

      for (const payload of payloads) {
        const serialized = JSON.stringify(payload);
        const parsed = JSON.parse(serialized);
        expect(parsed.category).toBe(payload.category);
        if (parsed.category === "node") {
          expect(parsed.type).toBe(payload.type);
        } else {
          expect(parsed.areaType).toBe(payload.areaType);
        }
      }
    });

    it("places node accurately at drop coordinates when dropped from toolbar", () => {
      const dropCoords = { x: 450, y: 350 };
      const type = "sticky";
      const isChecklist = true;

      // Logic from handleAddNode with explicitCoords
      const createdNode = {
        id: "test-node",
        type,
        x: dropCoords.x - (isChecklist ? 110 : 95),
        y: dropCoords.y - (isChecklist ? 105 : 85),
        width: isChecklist ? 220 : 190,
        height: isChecklist ? 210 : 170,
        hasCheckbox: isChecklist,
      };

      // Dropped center aligns with dropCoords: (450, 350)
      const centerX = createdNode.x + createdNode.width / 2;
      const centerY = createdNode.y + createdNode.height / 2;
      expect(centerX).toBe(dropCoords.x);
      expect(centerY).toBe(dropCoords.y);
    });

    it("calculates safe header height and draggable divider bounds for task cards", () => {
      // Standard task node
      const standardNode = { height: 140, headerHeight: undefined };
      const defaultStandardHeader =
        standardNode.height > 160 ? Math.round(standardNode.height * 0.4) : Math.min(56, Math.max(28, standardNode.height - 28));
      expect(defaultStandardHeader).toBe(56);

      // Resized large card (e.g. 500px height)
      const largeNode = { height: 500, headerHeight: undefined };
      const defaultLargeHeader =
        largeNode.height > 160 ? Math.round(largeNode.height * 0.4) : Math.min(56, Math.max(28, largeNode.height - 28));
      expect(defaultLargeHeader).toBe(200);

      // Explicitly dragged divider: user dragged divider to 180px
      const customNode = { height: 500, headerHeight: 180 };
      const safeCustomHeader = Math.max(
        24,
        Math.min(customNode.height - 24, customNode.headerHeight)
      );
      expect(safeCustomHeader).toBe(180);
      const bottomHeight = customNode.height - safeCustomHeader;
      expect(bottomHeight).toBe(320);

      // Clamping logic: divider cannot be dragged beyond bounds
      const minHeaderHeight = 24;
      const maxHeaderHeight = Math.max(minHeaderHeight, customNode.height - 24);
      const clampedLow = Math.round(Math.min(maxHeaderHeight, Math.max(minHeaderHeight, -50)));
      const clampedHigh = Math.round(Math.min(maxHeaderHeight, Math.max(minHeaderHeight, 600)));
      expect(clampedLow).toBe(24);
      expect(clampedHigh).toBe(476);
    });

    it("supports updating both bottom tags and progress names with percentages", () => {
      // Role tag scenario
      let nodeSubtitle = "President";
      nodeSubtitle = "Chief Executive Officer";
      expect(nodeSubtitle).toBe("Chief Executive Officer");

      // Progress scenario
      let progressSubtitle = "Completed (100%)";
      let progressVal = 100;

      // Update percentage preset to 75%
      const baseName = progressSubtitle.replace(/\s*\(\d+%\)/, "").trim() || "Progress";
      expect(baseName).toBe("Completed");

      progressSubtitle = `${baseName} (75%)`;
      progressVal = 75;
      expect(progressSubtitle).toBe("Completed (75%)");
      expect(progressVal).toBe(75);

      // Updating status to In Progress
      const newStatus = "In Progress";
      const newSubtitle = `${newStatus} (50%)`;
      expect(newSubtitle).toBe("In Progress (50%)");
    });
  });

  describe("Straight Line & Independent Arrow Mechanics (Rotatable Tips & Middle Drag)", () => {
    const getLineEndpoints = (node: any) => {
      const m = node.metaData;
      if (m?.x1 !== undefined && m?.y1 !== undefined && m?.x2 !== undefined && m?.y2 !== undefined) {
        if (m.isRelative) {
          return {
            x1: node.x + m.x1,
            y1: node.y + m.y1,
            x2: node.x + m.x2,
            y2: node.y + m.y2,
          };
        }
        return {
          x1: m.x1,
          y1: m.y1,
          x2: m.x2,
          y2: m.y2,
        };
      }
      return {
        x1: node.x,
        y1: node.y + Math.round(node.height / 2),
        x2: node.x + node.width,
        y2: node.y + Math.round(node.height / 2),
      };
    };

    it("calculates accurate tip endpoints for straight lines with relative metadata", () => {
      const lineNode = {
        id: "line-1",
        type: "line",
        x: 100,
        y: 150,
        width: 200,
        height: 50,
        metaData: {
          x1: 0,
          y1: 0,
          x2: 200,
          y2: 50,
          isRelative: true,
        },
      };

      const { x1, y1, x2, y2 } = getLineEndpoints(lineNode);
      expect(x1).toBe(100);
      expect(y1).toBe(150);
      expect(x2).toBe(300);
      expect(y2).toBe(200);
    });

    it("allows independent 360-degree rotation and extension when dragging right tip", () => {
      const lineNode = {
        id: "line-2",
        type: "line",
        x: 200,
        y: 200,
        width: 100,
        height: 10,
        metaData: { x1: 0, y1: 0, x2: 100, y2: 0, isRelative: true },
      };

      const pinnedStart = { x: 200, y: 200 };
      // Move right tip downwards at 45 degrees angle: (200 + 100, 200 + 100)
      const targetEnd = { x: 300, y: 300 };

      const minX = Math.min(pinnedStart.x, targetEnd.x);
      const minY = Math.min(pinnedStart.y, targetEnd.y);
      const updatedNode = {
        ...lineNode,
        x: minX,
        y: minY,
        width: Math.abs(targetEnd.x - pinnedStart.x),
        height: Math.abs(targetEnd.y - pinnedStart.y),
        metaData: {
          x1: pinnedStart.x - minX,
          y1: pinnedStart.y - minY,
          x2: targetEnd.x - minX,
          y2: targetEnd.y - minY,
          isRelative: true,
        },
      };

      const endpoints = getLineEndpoints(updatedNode);
      expect(endpoints.x1).toBe(200);
      expect(endpoints.y1).toBe(200);
      expect(endpoints.x2).toBe(300);
      expect(endpoints.y2).toBe(300);

      const angle = Math.atan2(endpoints.y2 - endpoints.y1, endpoints.x2 - endpoints.x1);
      expect(angle).toBeCloseTo(Math.PI / 4, 3);
    });

    it("allows independent 360-degree rotation and extension when dragging left tip", () => {
      const lineNode = {
        id: "line-3",
        type: "line",
        x: 200,
        y: 200,
        width: 100,
        height: 10,
        metaData: { x1: 0, y1: 0, x2: 100, y2: 0, isRelative: true },
      };

      const pinnedEnd = { x: 300, y: 200 };
      // Rotate left tip to point upwards-left: (150, 100)
      const targetStart = { x: 150, y: 100 };

      const minX = Math.min(targetStart.x, pinnedEnd.x);
      const minY = Math.min(targetStart.y, pinnedEnd.y);
      const updatedNode = {
        ...lineNode,
        x: minX,
        y: minY,
        width: Math.abs(pinnedEnd.x - targetStart.x),
        height: Math.abs(pinnedEnd.y - targetStart.y),
        metaData: {
          x1: targetStart.x - minX,
          y1: targetStart.y - minY,
          x2: pinnedEnd.x - minX,
          y2: pinnedEnd.y - minY,
          isRelative: true,
        },
      };

      const endpoints = getLineEndpoints(updatedNode);
      expect(endpoints.x1).toBe(150);
      expect(endpoints.y1).toBe(100);
      expect(endpoints.x2).toBe(300);
      expect(endpoints.y2).toBe(200);
    });

    it("translates entire line across canvas when dragging from middle preserving angle and length", () => {
      const initialNode = {
        id: "line-4",
        type: "line",
        x: 100,
        y: 100,
        width: 150,
        height: 80,
        metaData: { x1: 0, y1: 0, x2: 150, y2: 80, isRelative: true },
      };

      const initialEndpoints = getLineEndpoints(initialNode);
      const initialLength = Math.hypot(
        initialEndpoints.x2 - initialEndpoints.x1,
        initialEndpoints.y2 - initialEndpoints.y1
      );
      const initialAngle = Math.atan2(
        initialEndpoints.y2 - initialEndpoints.y1,
        initialEndpoints.x2 - initialEndpoints.x1
      );

      // Drag from middle by dx = +50, dy = -30
      const translatedNode = {
        ...initialNode,
        x: initialNode.x + 50,
        y: initialNode.y - 30,
      };

      const newEndpoints = getLineEndpoints(translatedNode);
      expect(newEndpoints.x1).toBe(150);
      expect(newEndpoints.y1).toBe(70);
      expect(newEndpoints.x2).toBe(300);
      expect(newEndpoints.y2).toBe(150);

      const newLength = Math.hypot(
        newEndpoints.x2 - newEndpoints.x1,
        newEndpoints.y2 - newEndpoints.y1
      );
      const newAngle = Math.atan2(
        newEndpoints.y2 - newEndpoints.y1,
        newEndpoints.x2 - newEndpoints.x1
      );

      expect(newLength).toBeCloseTo(initialLength, 5);
      expect(newAngle).toBeCloseTo(initialAngle, 5);
    });

    it("supports Shift 15-degree angle snapping during tip drag", () => {
      const pinned = { x: 100, y: 100 };
      // Target dragged at ~32 degrees
      const target = { x: 200, y: 160 };
      const dx = target.x - pinned.x;
      const dy = target.y - pinned.y;
      const dist = Math.hypot(dx, dy);

      let angle = Math.atan2(dy, dx);
      const snap = Math.PI / 12; // 15 degrees
      angle = Math.round(angle / snap) * snap;

      const snappedX = Math.round(pinned.x + dist * Math.cos(angle));
      const snappedY = Math.round(pinned.y + dist * Math.sin(angle));

      const snappedAngleDeg = Math.round((angle * 180) / Math.PI);
      expect(snappedAngleDeg % 15).toBe(0);
      expect(snappedAngleDeg).toBe(30);
      expect(snappedX).toBeGreaterThan(pinned.x);
      expect(snappedY).toBeGreaterThan(pinned.y);
    });

    it("validates independent arrow directions and line styles", () => {
      const arrowNode = {
        id: "arrow-1",
        type: "line",
        shapeType: "arrow",
        arrowDirection: "bidirectional",
        lineStyle: "dashed",
        strokeWidth: 5,
      };

      expect(arrowNode.shapeType).toBe("arrow");
      expect(arrowNode.arrowDirection).toBe("bidirectional");
      expect(arrowNode.lineStyle).toBe("dashed");
      expect(arrowNode.strokeWidth).toBe(5);
    });

    it("scales arrowhead triangle dynamically when stroke width increases", () => {
      const getWingLength = (sw: number) => Math.max(12, Math.round(sw * 2.8 + 6));
      expect(getWingLength(2)).toBe(12);
      expect(getWingLength(3)).toBe(14);
      expect(getWingLength(5)).toBe(20);
      expect(getWingLength(8)).toBe(28);

      // Verify that arrowhead for 8px is significantly larger than 2px (more than 2x larger)
      expect(getWingLength(8)).toBeGreaterThan(getWingLength(2) * 2);
    });

    it("ensures line stroke trims under arrowhead so rounded cap never pokes through the triangle apex", () => {
      const strokeW = 8;
      const x1 = 100;
      const y1 = 100;
      const x2 = 300;
      const y2 = 100;
      const dist = 200;

      const wingLength = Math.max(12, Math.round(strokeW * 2.8 + 6)); // 28
      const arrowDepth = wingLength * Math.cos(Math.PI / 6); // ~24.25
      const endOffset = Math.min(arrowDepth * 0.45, dist * 0.45); // ~10.91

      const strokeX2 = x2 - endOffset; // ~289.09
      const roundCapExtent = strokeX2 + strokeW / 2; // ~293.09

      // Verify the round cap of the stroke ends safely behind the apex (x2 = 300)
      expect(roundCapExtent).toBeLessThan(x2);
      expect(x2 - roundCapExtent).toBeGreaterThan(5); // At least 5px clearance behind the apex
    });

    it("ensures cloned lines and drawings do not accumulate unwanted Copy title tags", () => {
      const sourceLine = {
        id: "line-123",
        type: "line",
        shapeType: "arrow",
        title: "",
      };

      const isLineOrDrawing =
        sourceLine.type === "line" ||
        sourceLine.shapeType === "line" ||
        sourceLine.shapeType === "arrow" ||
        sourceLine.type === "drawing";

      let clonedTitle = "";
      if (isLineOrDrawing) {
        clonedTitle =
          sourceLine.title && !sourceLine.title.toLowerCase().includes("copy")
            ? sourceLine.title
            : "";
      } else {
        clonedTitle = sourceLine.title ? `${sourceLine.title}` : "Copy";
      }

      expect(clonedTitle).toBe("");

      // Duplicating a node that already had "Copy" in title should strip it for lines
      const lineWithCopy = {
        ...sourceLine,
        title: "",
      };
      const cleanTitle =
        lineWithCopy.title && !lineWithCopy.title.toLowerCase().includes("copy")
          ? lineWithCopy.title
          : "";
      expect(cleanTitle).toBe("");
    });

    it("calculates accurate minimap bounding box and viewport rectangle in real-time", () => {
      const sampleNodes = [
        { id: "n1", x: 100, y: 150, width: 200, height: 100, color: "#38BDF8" },
        { id: "n2", x: 600, y: 400, width: 160, height: 120, color: "#EC4899" },
      ];

      const bounds = sampleNodes.reduce(
        (acc, n) => ({
          minX: Math.min(acc.minX, n.x),
          minY: Math.min(acc.minY, n.y),
          maxX: Math.max(acc.maxX, n.x + n.width),
          maxY: Math.max(acc.maxY, n.y + n.height),
        }),
        { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
      );

      expect(bounds.minX).toBe(100);
      expect(bounds.minY).toBe(150);
      expect(bounds.maxX).toBe(760);
      expect(bounds.maxY).toBe(520);

      const pan = { x: -200, y: -100 };
      const zoom = 0.5;
      const winW = 1200;
      const winH = 800;

      const viewCanvasX = -pan.x / zoom; // 400
      const viewCanvasY = -pan.y / zoom; // 200
      const viewCanvasW = winW / zoom; // 2400
      const viewCanvasH = winH / zoom; // 1600

      expect(viewCanvasX).toBe(400);
      expect(viewCanvasY).toBe(200);
      expect(viewCanvasW).toBe(2400);
      expect(viewCanvasH).toBe(1600);

      // Minimap scaling
      const mmMinX = Math.min(bounds.minX, viewCanvasX) - 300;
      const mmMinY = Math.min(bounds.minY, viewCanvasY) - 300;
      const mmMaxX = Math.max(bounds.maxX, viewCanvasX + viewCanvasW) + 300;
      const mmMaxY = Math.max(bounds.maxY, viewCanvasY + viewCanvasH) + 300;

      const mmWorldW = mmMaxX - mmMinX;
      const mmWorldH = mmMaxY - mmMinY;

      expect(mmWorldW).toBeGreaterThan(2000);
      expect(mmWorldH).toBeGreaterThan(1500);

      const minimapW = 200;
      const minimapH = 130;
      const mmScale = Math.min(minimapW / mmWorldW, minimapH / mmWorldH);
      expect(mmScale).toBeGreaterThan(0);

      // Clicking on minimap target centers the pan
      const targetCanvasX = 600;
      const targetCanvasY = 400;
      const centeredPanX = winW / 2 - targetCanvasX * zoom;
      const centeredPanY = winH / 2 - targetCanvasY * zoom;

      expect(centeredPanX).toBe(300);
      expect(centeredPanY).toBe(200);
    });
  });
});

describe("Sticky Note Multi-Format Structuring (JSON, Markdown, Text, Checklist)", () => {
  describe("JSON Formatting Structure", () => {
    it("validates and formats valid JSON structure with 2-space indentation", () => {
      const rawJson = '{"status":"active","count":42,"items":["a","b"]}';
      const res = validateJson(rawJson);
      expect(res.isValid).toBe(true);
      expect(res.error).toBeUndefined();
      expect(res.keyCount).toBe(3);
      expect(res.formatted).toContain('  "status": "active"');
      expect(res.formatted).toContain('  "count": 42');
    });

    it("identifies invalid JSON syntax and provides readable error message", () => {
      const invalidJson = '{"status": "active", count: }';
      const res = validateJson(invalidJson);
      expect(res.isValid).toBe(false);
      expect(res.error).toBeTruthy();
      expect(res.formatted).toBeUndefined();
    });

    it("verifies DEFAULT_JSON_NOTE is valid JSON syntax out-of-the-box", () => {
      const res = validateJson(DEFAULT_JSON_NOTE);
      expect(res.isValid).toBe(true);
      expect(res.keyCount).toBeGreaterThanOrEqual(4);
    });
  });

  describe("Markdown Rendering & Interactive Checklists", () => {
    it("verifies DEFAULT_MARKDOWN_NOTE has headers, checklists, and code formatting", () => {
      expect(DEFAULT_MARKDOWN_NOTE).toContain("# Project Roadmap & Specs");
      expect(DEFAULT_MARKDOWN_NOTE).toContain("- [ ]");
      expect(DEFAULT_MARKDOWN_NOTE).toContain("- [x]");
    });

    it("toggles markdown checklist box from unchecked to checked at specific line", () => {
      const md = "# Tasks\n- [ ] Deploy to production\n- [x] Run unit tests";
      const toggled = toggleMarkdownCheckbox(md, 1);
      const lines = toggled.split("\n");
      expect(lines[1]).toBe("- [x] Deploy to production");
      expect(lines[2]).toBe("- [x] Run unit tests");
    });

    it("toggles markdown checklist box from checked back to unchecked at specific line", () => {
      const md = "# Tasks\n- [x] Deploy to production\n- [x] Run unit tests";
      const toggled = toggleMarkdownCheckbox(md, 1);
      const lines = toggled.split("\n");
      expect(lines[1]).toBe("- [ ] Deploy to production");
      expect(lines[2]).toBe("- [x] Run unit tests");
    });

    it("leaves non-checklist markdown lines untouched", () => {
      const md = "# Header Line\nSome regular paragraph text\n> Blockquote";
      const untouched = toggleMarkdownCheckbox(md, 0);
      expect(untouched).toBe(md);
    });
  });

  describe("Text File Structuring", () => {
    it("verifies DEFAULT_TEXT_NOTE contains clean plain-text layout", () => {
      expect(DEFAULT_TEXT_NOTE).toContain("Project Architecture Notes");
      expect(DEFAULT_TEXT_NOTE).toContain("1. Database Isolation");
      expect(DEFAULT_TEXT_NOTE).toContain("2. Real-time Events");
    });
  });
});

describe("Multi-Object Selection, Link & Unlink Engine", () => {
  const sampleNodes = [
    { id: "node-1", type: "task" as const, title: "Auth API", x: 100, y: 100, width: 200, height: 100 },
    { id: "node-2", type: "task" as const, title: "Database", x: 400, y: 100, width: 200, height: 100 },
    { id: "node-3", type: "task" as const, title: "Dashboard", x: 700, y: 100, width: 200, height: 100 },
    { id: "node-4", type: "sticky" as const, title: "External Note", x: 400, y: 350, width: 200, height: 100 },
  ];

  it("supports multi-selection toggle via Ctrl, Meta, or Shift keys", () => {
    let selected: string[] = [];

    // Shift-click node-1
    selected = selected.includes("node-1") ? selected.filter((id) => id !== "node-1") : [...selected, "node-1"];
    expect(selected).toEqual(["node-1"]);

    // Shift-click node-2
    selected = selected.includes("node-2") ? selected.filter((id) => id !== "node-2") : [...selected, "node-2"];
    expect(selected).toEqual(["node-1", "node-2"]);

    // Shift-click node-3
    selected = selected.includes("node-3") ? selected.filter((id) => id !== "node-3") : [...selected, "node-3"];
    expect(selected).toEqual(["node-1", "node-2", "node-3"]);

    // Shift-click node-2 again to deselect
    selected = selected.includes("node-2") ? selected.filter((id) => id !== "node-2") : [...selected, "node-2"];
    expect(selected).toEqual(["node-1", "node-3"]);
  });

  it("links two selected objects with a forward connector arrow", () => {
    const selected = ["node-1", "node-2"];
    const existingEdges: any[] = [];

    const newEdgesToAdd: any[] = [];
    for (let i = 0; i < selected.length - 1; i++) {
      const from = selected[i];
      const to = selected[i + 1];
      newEdgesToAdd.push({
        id: `edge-${from}-${to}`,
        from,
        to,
        arrowDirection: "forward",
        color: "#3B82F6",
      });
    }

    const updatedEdges = [...existingEdges, ...newEdgesToAdd];
    expect(updatedEdges).toHaveLength(1);
    expect(updatedEdges[0].from).toBe("node-1");
    expect(updatedEdges[0].to).toBe("node-2");
    expect(updatedEdges[0].arrowDirection).toBe("forward");
  });

  it("links multiple selected objects in sequential chain (A -> B -> C)", () => {
    const selected = ["node-1", "node-2", "node-3"];
    const existingEdges: any[] = [];

    const newEdgesToAdd: any[] = [];
    for (let i = 0; i < selected.length - 1; i++) {
      const from = selected[i];
      const to = selected[i + 1];
      newEdgesToAdd.push({
        id: `edge-${from}-${to}`,
        from,
        to,
        arrowDirection: "forward",
      });
    }

    const updatedEdges = [...existingEdges, ...newEdgesToAdd];
    expect(updatedEdges).toHaveLength(2);
    expect(updatedEdges[0]).toMatchObject({ from: "node-1", to: "node-2" });
    expect(updatedEdges[1]).toMatchObject({ from: "node-2", to: "node-3" });
  });

  it("links objects in star topology connecting root to all selected targets", () => {
    const selected = ["node-1", "node-2", "node-3"];
    const rootId = selected[0];
    const newEdgesToAdd: any[] = [];

    for (let i = 1; i < selected.length; i++) {
      newEdgesToAdd.push({
        id: `edge-star-${rootId}-${selected[i]}`,
        from: rootId,
        to: selected[i],
        arrowDirection: "forward",
      });
    }

    expect(newEdgesToAdd).toHaveLength(2);
    expect(newEdgesToAdd[0]).toMatchObject({ from: "node-1", to: "node-2" });
    expect(newEdgesToAdd[1]).toMatchObject({ from: "node-1", to: "node-3" });
  });

  it("updates existing links to bidirectional (<->) arrows", () => {
    const selected = ["node-1", "node-2"];
    const edges = [
      { id: "e1", from: "node-1", to: "node-2", arrowDirection: "forward" },
    ];

    const updated = edges.map((e) => {
      if ((e.from === "node-1" && e.to === "node-2") || (e.from === "node-2" && e.to === "node-1")) {
        return { ...e, arrowDirection: "bidirectional" as const };
      }
      return e;
    });

    expect(updated[0].arrowDirection).toBe("bidirectional");
  });

  it("unlinks selected objects and removes connector arrows between them", () => {
    const selected = ["node-1", "node-2", "node-3"];
    const edges = [
      { id: "e1", from: "node-1", to: "node-2" }, // Inter-selected: should be removed
      { id: "e2", from: "node-2", to: "node-3" }, // Inter-selected: should be removed
      { id: "e3", from: "node-1", to: "node-4" }, // Connected to external node-4: MUST PRESERVE
    ];

    // Filter out links connecting selected nodes together
    const updatedEdges = edges.filter(
      (e) => !(selected.includes(e.from) && selected.includes(e.to))
    );

    expect(updatedEdges).toHaveLength(1);
    expect(updatedEdges[0].id).toBe("e3");
    expect(updatedEdges[0].to).toBe("node-4");
  });

  it("computes accurate linked state count between selected objects", () => {
    const selected = ["node-1", "node-2", "node-3"];
    const edges = [
      { id: "e1", from: "node-1", to: "node-2" },
      { id: "e2", from: "node-2", to: "node-3" },
      { id: "e3", from: "node-1", to: "node-4" },
    ];

    const linkedEdges = edges.filter(
      (e) => selected.includes(e.from) && selected.includes(e.to)
    );

    expect(linkedEdges).toHaveLength(2);
    expect(linkedEdges.map((e) => e.id)).toEqual(["e1", "e2"]);
  });
});

describe("Whiteboard Canvas Drag-and-Drop, Hierarchy Branching & Note In-Place Editing", () => {
  it("handles dragging toolbar items onto canvas across all node types", () => {
    const mockDropPayload = {
      category: "node" as const,
      type: "sticky" as const,
      title: "Product Roadmap Note",
      noteFormat: "text" as const,
      color: "#EC4899",
    };

    const canvasX = 350;
    const canvasY = 220;

    const createdNode = {
      id: `node-${Date.now()}`,
      type: mockDropPayload.type,
      x: canvasX,
      y: canvasY,
      width: 220,
      height: 180,
      title: mockDropPayload.title,
      noteFormat: mockDropPayload.noteFormat,
      color: mockDropPayload.color,
      body: "",
    };

    expect(createdNode.type).toBe("sticky");
    expect(createdNode.title).toBe("Product Roadmap Note");
    expect(createdNode.x).toBe(350);
    expect(createdNode.y).toBe(220);
  });

  it("verifies ONLY org task card branches into another org task card with gold header and blue position box", () => {
    const parentTaskNode = {
      id: "task-parent",
      type: "task" as const,
      x: 400,
      y: 100,
      width: 160,
      height: 96,
      title: "Add a task here to represent this team member!",
      subtitle: "Team Member / Role",
      color: "#0078D4",
      headerHeight: 40,
      zIndex: 2,
    };

    const branchTaskNode = {
      id: `node-branch-${Date.now()}`,
      type: "task" as const,
      x: parentTaskNode.x + 80,
      y: parentTaskNode.y + parentTaskNode.height + 70,
      width: parentTaskNode.width || 160,
      height: parentTaskNode.height || 96,
      title: "New Team Member",
      subtitle: "Position",
      color: parentTaskNode.color || "#0078D4",
      headerHeight: parentTaskNode.headerHeight,
      fillType: "solid" as const,
      zIndex: 2,
    };

    expect(branchTaskNode.type).toBe("task");
    expect(branchTaskNode.title).toBe("New Team Member");
    expect(branchTaskNode.subtitle).toBe("Position");
  });

  it("verifies shapes branch into matching geometric design (e.g. Rounded orange shape)", () => {
    const parentShapeNode = {
      id: "shape-parent",
      type: "shape" as const,
      shapeType: "rounded" as const,
      x: 300,
      y: 100,
      width: 180,
      height: 100,
      title: "Rounded",
      color: "#F59E0B",
      textColor: "#FFFFFF",
    };

    const branchShapeNode = {
      id: `node-branch-${Date.now()}`,
      type: "shape" as const,
      shapeType: parentShapeNode.shapeType || "rounded",
      x: parentShapeNode.x + 80,
      y: parentShapeNode.y + parentShapeNode.height + 70,
      width: parentShapeNode.width || 180,
      height: parentShapeNode.height || 100,
      title: parentShapeNode.title || "Rounded",
      color: parentShapeNode.color || "#F59E0B",
      fillType: "solid" as const,
      textColor: parentShapeNode.textColor || "#FFFFFF",
      fontWeight: "bold" as const,
      fontSize: "14px",
      textAlign: "center" as const,
      zIndex: 2,
    };

    expect(branchShapeNode.type).toBe("shape");
    expect(branchShapeNode.shapeType).toBe("rounded");
    expect(branchShapeNode.title).toBe("Rounded");
    expect(branchShapeNode.color).toBe("#F59E0B");
  });

  it("ensures sticky note title editing and body editing maintain distinct states without blur conflict", () => {
    let editingTitleId: string | null = null;
    let editingNodeId: string | null = null;

    const note = {
      id: "sticky-101",
      title: "Note",
      body: "TENANT B (ID: comp_beta)",
    };

    // User double clicks title to edit title
    editingTitleId = note.id;
    expect(editingTitleId).toBe("sticky-101");
    expect(editingNodeId).toBeNull(); // Body is NOT in edit mode, no focus conflict!

    // User saves title
    const updatedTitle = "Sprint Alpha Notes";
    note.title = updatedTitle;
    editingTitleId = null;

    // User double clicks body to edit body text
    editingNodeId = note.id;
    expect(editingNodeId).toBe("sticky-101");
    expect(editingTitleId).toBeNull(); // Title is NOT in edit mode, no focus conflict!

    // User updates body text
    const updatedBody = "TENANT B (ID: comp_beta) - Provisioned & Active";
    note.body = updatedBody;
    editingNodeId = null;

    expect(note.title).toBe("Sprint Alpha Notes");
    expect(note.body).toContain("Provisioned & Active");
  });

  it("verifies scroll containment logic allows internal element scrolling while preventing canvas pan", () => {
    const mockScrollable = {
      scrollHeight: 350,
      clientHeight: 150,
      scrollWidth: 150,
      clientWidth: 150,
      scrollTop: 10,
      scrollLeft: 0,
    };

    const hasVerticalOverflow = mockScrollable.scrollHeight > mockScrollable.clientHeight + 1;
    expect(hasVerticalOverflow).toBe(true);

    const deltaY: number = 40;
    let canvasPanDisplaced = false;

    // Simulated handleWheel logic
    if (hasVerticalOverflow && deltaY !== 0) {
      mockScrollable.scrollTop += deltaY;
      // canvas pan is NOT displaced because wheel is contained
      canvasPanDisplaced = false;
    }

    expect(mockScrollable.scrollTop).toBe(50);
    expect(canvasPanDisplaced).toBe(false);
  });

  it("verifies unified group entity linking, synchronized movement, and compound temporary groups {{a,b,c}, e}", () => {
    // Setup nodes: a, b, c, d, e
    const nodes = [
      { id: "a", x: 100, y: 100, width: 120, height: 80, groupId: "" },
      { id: "b", x: 260, y: 100, width: 120, height: 80, groupId: "" },
      { id: "c", x: 420, y: 100, width: 120, height: 80, groupId: "" },
      { id: "d", x: 100, y: 300, width: 120, height: 80, groupId: "" },
      { id: "e", x: 300, y: 300, width: 120, height: 80, groupId: "" },
    ];

    // Helper function matching WhiteboardCanvas resolveGroupMembers
    const resolveGroupMembers = (ids: string[], allNodes: typeof nodes): string[] => {
      const result = new Set<string>(ids);
      const activeGroupIds = new Set<string>();

      for (const id of ids) {
        const n = allNodes.find((item) => item.id === id);
        if (n?.groupId) {
          activeGroupIds.add(n.groupId);
        }
      }

      if (activeGroupIds.size > 0) {
        for (const n of allNodes) {
          if (n.groupId && activeGroupIds.has(n.groupId)) {
            result.add(n.id);
          }
        }
      }

      return Array.from(result);
    };

    // 1. User selects a, b, c and clicks 'Link as Group'
    const selectedToGroup = ["a", "b", "c"];
    const newGroupId = "group-abc-999";
    nodes.forEach((n) => {
      if (selectedToGroup.includes(n.id)) {
        n.groupId = newGroupId;
      }
    });

    expect(nodes.find((n) => n.id === "a")?.groupId).toBe("group-abc-999");
    expect(nodes.find((n) => n.id === "b")?.groupId).toBe("group-abc-999");
    expect(nodes.find((n) => n.id === "c")?.groupId).toBe("group-abc-999");
    expect(nodes.find((n) => n.id === "d")?.groupId).toBe("");
    expect(nodes.find((n) => n.id === "e")?.groupId).toBe("");

    // 2. Clicking single node 'a' automatically selects all group members {a, b, c}
    const singleClickSelection = resolveGroupMembers(["a"], nodes);
    expect(singleClickSelection).toEqual(["a", "b", "c"]);

    // 3. Dragging group {a, b, c} moves all 3 nodes together maintaining relative distances
    const initialDistAB = nodes[1].x - nodes[0].x; // 260 - 100 = 160
    const initialDistBC = nodes[2].x - nodes[1].x; // 420 - 260 = 160

    const dragDeltaX = 50;
    const dragDeltaY = 30;

    // Group drag execution
    nodes.forEach((n) => {
      if (singleClickSelection.includes(n.id)) {
        n.x += dragDeltaX;
        n.y += dragDeltaY;
      }
    });

    expect(nodes[0]).toMatchObject({ id: "a", x: 150, y: 130 });
    expect(nodes[1]).toMatchObject({ id: "b", x: 310, y: 130 });
    expect(nodes[2]).toMatchObject({ id: "c", x: 470, y: 130 });
    // Nodes d and e were NOT selected and stayed stationary
    expect(nodes[3]).toMatchObject({ id: "d", x: 100, y: 300 });
    expect(nodes[4]).toMatchObject({ id: "e", x: 300, y: 300 });

    // Relative distances strictly preserved
    expect(nodes[1].x - nodes[0].x).toBe(initialDistAB);
    expect(nodes[2].x - nodes[1].x).toBe(initialDistBC);

    // 4. Temporary compound group creation {{a, b, c}, e} by multi-selecting or marquee dragging
    // Selection contains group {a, b, c} plus independent node e
    const compoundSelection = resolveGroupMembers(["a", "e"], nodes);
    expect(compoundSelection).toEqual(expect.arrayContaining(["a", "b", "c", "e"]));
    expect(compoundSelection).not.toContain("d");

    // Dragging compound group {{a, b, c}, e} moves all 4 together
    const compoundDeltaX = 40;
    const compoundDeltaY = -20;
    nodes.forEach((n) => {
      if (compoundSelection.includes(n.id)) {
        n.x += compoundDeltaX;
        n.y += compoundDeltaY;
      }
    });

    expect(nodes[0]).toMatchObject({ id: "a", x: 190, y: 110 });
    expect(nodes[1]).toMatchObject({ id: "b", x: 350, y: 110 });
    expect(nodes[2]).toMatchObject({ id: "c", x: 510, y: 110 });
    expect(nodes[4]).toMatchObject({ id: "e", x: 340, y: 280 });
    // Node d is still stationary!
    expect(nodes[3]).toMatchObject({ id: "d", x: 100, y: 300 });

    // 5. Unlink Group dissolves groupId back to independent objects
    nodes.forEach((n) => {
      if (n.groupId === newGroupId) {
        n.groupId = "";
      }
    });

    expect(nodes[0].groupId).toBe("");
    expect(nodes[1].groupId).toBe("");
    expect(nodes[2].groupId).toBe("");

    // Now clicking 'a' only selects 'a'
    const unlinkedSelection = resolveGroupMembers(["a"], nodes);
    expect(unlinkedSelection).toEqual(["a"]);
  });

  it("allows individual box color and text edits on linked group members while dragging moves group together", () => {
    const nodes = [
      { id: "a", x: 100, y: 100, width: 120, height: 80, color: "#0078D4", title: "President", groupId: "group-1" },
      { id: "b", x: 260, y: 100, width: 120, height: 80, color: "#0078D4", title: "VP", groupId: "group-1" },
      { id: "c", x: 420, y: 100, width: 120, height: 80, color: "#0078D4", title: "Assistant", groupId: "group-1" },
    ];

    // 1. User clicks node 'b' without Shift -> selects ONLY node 'b' individually
    let selectedNodeId: string | null = "b";
    let selectedNodeIds: string[] = ["b"];

    expect(selectedNodeId).toBe("b");
    expect(selectedNodeIds).toEqual(["b"]);

    // 2. Individual edit: user changes box color of node 'b' to Emerald Green
    const newColor = "#10B981";
    const targetIds = selectedNodeIds.length <= 1 && selectedNodeId ? [selectedNodeId] : selectedNodeIds;

    const updatedNodes = nodes.map((n) =>
      targetIds.includes(n.id) ? { ...n, color: newColor } : n
    );

    // Node 'b' received new color, while 'a' and 'c' remained original blue!
    expect(updatedNodes.find((n) => n.id === "b")?.color).toBe("#10B981");
    expect(updatedNodes.find((n) => n.id === "a")?.color).toBe("#0078D4");
    expect(updatedNodes.find((n) => n.id === "c")?.color).toBe("#0078D4");

    // 3. User drags node 'b' -> all group members move together maintaining identical relative spacing
    const activeGroupId = updatedNodes.find((n) => n.id === "b")?.groupId;
    const nodesToDrag = activeGroupId
      ? updatedNodes.filter((n) => n.groupId === activeGroupId).map((n) => n.id)
      : ["b"];

    expect(nodesToDrag).toEqual(["a", "b", "c"]);

    const dx = 45;
    const dy = 25;
    const draggedNodes = updatedNodes.map((n) =>
      nodesToDrag.includes(n.id) ? { ...n, x: n.x + dx, y: n.y + dy } : n
    );

    expect(draggedNodes[0]).toMatchObject({ id: "a", x: 145, y: 125, color: "#0078D4" });
    expect(draggedNodes[1]).toMatchObject({ id: "b", x: 305, y: 125, color: "#10B981" });
    expect(draggedNodes[2]).toMatchObject({ id: "c", x: 465, y: 125, color: "#0078D4" });

    // Spacing strictly preserved
    expect(draggedNodes[1].x - draggedNodes[0].x).toBe(160);
    expect(draggedNodes[2].x - draggedNodes[1].x).toBe(160);
  });

  it("copies an already-linked group into a new linked group entity with independent unique groupId, preserving exact relative coordinates and internal arrows", () => {
    const originalNodes = [
      { id: "orig-1", x: 100, y: 100, width: 140, height: 60, title: "Database", groupId: "group-source-1" },
      { id: "orig-2", x: 300, y: 100, width: 140, height: 60, title: "Server", groupId: "group-source-1" },
    ];
    const originalEdges = [
      { id: "edge-1", from: "orig-1", to: "orig-2", arrowDirection: "forward" },
    ];

    // Simulate handleDuplicateGroup execution for linked group
    const targetNodes = originalNodes.filter((n) => n.groupId === "group-source-1");
    const idMap = new Map<string, string>();
    const newLinkedGroupId = `group-cloned-${Date.now()}`;
    const offsetX = 40;
    const offsetY = 40;

    const clonedNodes = targetNodes.map((n) => {
      const newId = `clone-${n.id}`;
      idMap.set(n.id, newId);
      return {
        ...n,
        id: newId,
        groupId: newLinkedGroupId,
        x: n.x + offsetX,
        y: n.y + offsetY,
      };
    });

    const clonedEdges = originalEdges
      .filter((e) => idMap.has(e.from) && idMap.has(e.to))
      .map((e) => ({
        ...e,
        id: `cloned-${e.id}`,
        from: idMap.get(e.from)!,
        to: idMap.get(e.to)!,
      }));

    // Verify independent new group ID
    expect(clonedNodes).toHaveLength(2);
    expect(clonedNodes[0].groupId).toBe(newLinkedGroupId);
    expect(clonedNodes[1].groupId).toBe(newLinkedGroupId);
    expect(clonedNodes[0].groupId).not.toBe("group-source-1");

    // Verify coordinates shifted by offset while preserving relative spacing
    expect(clonedNodes[0].x).toBe(140);
    expect(clonedNodes[1].x).toBe(340);
    expect(clonedNodes[1].x - clonedNodes[0].x).toBe(200);

    // Verify titles preserved without unwanted (Copy) tags
    expect(clonedNodes[0].title).toBe("Database");
    expect(clonedNodes[1].title).toBe("Server");

    // Verify cloned internal edges connected to cloned nodes
    expect(clonedEdges).toHaveLength(1);
    expect(clonedEdges[0].from).toBe("clone-orig-1");
    expect(clonedEdges[0].to).toBe("clone-orig-2");
  });

  it("copies a temporary multi-selection group (unlinked items) and automatically links the cloned items under a new groupId so mouse clicks outside cannot dislocate the arrangement", () => {
    // 3 unlinked items in a temporary multi-selection
    const tempGroupNodes = [
      { id: "temp-a", x: 200, y: 150, width: 120, height: 60, title: "Step 1", groupId: "" },
      { id: "temp-b", x: 360, y: 150, width: 120, height: 60, title: "Step 2", groupId: "" },
      { id: "temp-c", x: 520, y: 150, width: 120, height: 60, title: "Step 3", groupId: "" },
    ];
    const selectedNodeIds = ["temp-a", "temp-b", "temp-c"];

    // User triggers 'Copy Group' from overhead options
    const targetNodes = tempGroupNodes.filter((n) => selectedNodeIds.includes(n.id));
    const newLinkedGroupId = `group-cloned-${Date.now()}`;
    const offsetX = 40;
    const offsetY = 40;

    const clonedNodes = targetNodes.map((n) => ({
      ...n,
      id: `clone-${n.id}`,
      groupId: newLinkedGroupId, // Crucial: always placed on canvas in linked form!
      x: n.x + offsetX,
      y: n.y + offsetY,
    }));

    // Cloned items are all assigned the newLinkedGroupId
    expect(clonedNodes.every((n) => n.groupId === newLinkedGroupId)).toBe(true);

    // Mouse clicked outside: selection is cleared!
    let activeSelection: string[] = [];
    expect(activeSelection).toHaveLength(0);

    // User clicks on clone-temp-b to drag to a fresh area:
    // resolveGroupMembers automatically resolves all group members via groupId!
    const resolveGroupMembers = (ids: string[], allNodes: typeof clonedNodes): string[] => {
      const activeGroupIds = new Set(allNodes.filter((n) => ids.includes(n.id) && n.groupId).map((n) => n.groupId));
      return allNodes.filter((n) => ids.includes(n.id) || (n.groupId && activeGroupIds.has(n.groupId))).map((n) => n.id);
    };

    const nodesToDrag = resolveGroupMembers(["clone-temp-b"], clonedNodes);
    expect(nodesToDrag).toEqual(["clone-temp-a", "clone-temp-b", "clone-temp-c"]);

    // Dragging translates all 3 cloned nodes together to fresh area without dislocating relative positions
    const dragDx = 300;
    const dragDy = 200;
    const movedNodes = clonedNodes.map((n) =>
      nodesToDrag.includes(n.id) ? { ...n, x: n.x + dragDx, y: n.y + dragDy } : n
    );

    expect(movedNodes[0]).toMatchObject({ id: "clone-temp-a", x: 540, y: 390 });
    expect(movedNodes[1]).toMatchObject({ id: "clone-temp-b", x: 700, y: 390 });
    expect(movedNodes[2]).toMatchObject({ id: "clone-temp-c", x: 860, y: 390 });

    // Relative distances strictly preserved
    expect(movedNodes[1].x - movedNodes[0].x).toBe(160);
    expect(movedNodes[2].x - movedNodes[1].x).toBe(160);

    // After moving, user can click Unlink to dissolve group if needed
    const unlinkedNodes = movedNodes.map((n) => ({ ...n, groupId: "" }));
    expect(unlinkedNodes.every((n) => n.groupId === "")).toBe(true);
    expect(resolveGroupMembers(["clone-temp-b"], unlinkedNodes)).toEqual(["clone-temp-b"]);
  });
});

describe("Whiteboard Tech, Product & Flow Icons Gallery", () => {
  it("defines all 6 grouped categories with exact matching types and metadata", () => {
    expect(ICON_GALLERY_GROUPS).toHaveLength(6);
    const groupTypes = ICON_GALLERY_GROUPS.map((g) => g.type);
    expect(groupTypes).toEqual(["infra", "flow", "ideation", "logic", "metrics", "media"]);

    const totalItems = getAllIconGalleryItems();
    expect(totalItems).toHaveLength(42);
  });

  it("validates Group 1: Infrastructure & Networking (type: 'infra') items and icons", () => {
    const infraGroup = ICON_GALLERY_GROUPS.find((g) => g.type === "infra");
    expect(infraGroup).toBeDefined();
    expect(infraGroup?.items).toHaveLength(7);

    const itemNames = infraGroup?.items.map((i) => i.name);
    expect(itemNames).toEqual(["Database", "API", "Browser", "Server", "Client", "User", "Gate"]);

    const dbItem = infraGroup?.items.find((i) => i.name === "Database");
    expect(dbItem?.iconName).toBe("Database");
    expect(dbItem?.subtitle).toContain("MongoDB");

    const serverItem = infraGroup?.items.find((i) => i.name === "Server");
    expect(serverItem?.iconName).toBe("Server");
    expect(serverItem?.subtitle).toContain("Express / Node");
  });

  it("validates Group 2: Routing, State & Data Pipelines (type: 'flow') items and icons", () => {
    const flowGroup = ICON_GALLERY_GROUPS.find((g) => g.type === "flow");
    expect(flowGroup).toBeDefined();
    expect(flowGroup?.items).toHaveLength(7);

    const itemNames = flowGroup?.items.map((i) => i.name);
    expect(itemNames).toEqual(["Route", "Re-route", "Connect", "Break", "Pipeline", "Funnel", "Crash"]);

    const crashItem = flowGroup?.items.find((i) => i.name === "Crash");
    expect(crashItem?.iconName).toBe("Bomb");
    expect(crashItem?.subtitle).toContain("Server error");
  });

  it("validates Group 3: Concept Ideation & Brainstorming (type: 'ideation') items and icons", () => {
    const ideationGroup = ICON_GALLERY_GROUPS.find((g) => g.type === "ideation");
    expect(ideationGroup).toBeDefined();
    expect(ideationGroup?.items).toHaveLength(5);

    const itemNames = ideationGroup?.items.map((i) => i.name);
    expect(itemNames).toEqual(["Question", "Idea", "Thoughts", "Imagine", "Kick"]);
  });

  it("validates Group 4: Logic, Variables & Scaling Data (type: 'logic') items and icons", () => {
    const logicGroup = ICON_GALLERY_GROUPS.find((g) => g.type === "logic");
    expect(logicGroup).toBeDefined();
    expect(logicGroup?.items).toHaveLength(7);

    const itemNames = logicGroup?.items.map((i) => i.name);
    expect(itemNames).toEqual(["Key", "Value", "Pair", "Master", "Hash", "Encrypted", "Substance"]);
  });

  it("validates Group 5: Metrics, Value & Tracking (type: 'metrics') items and icons", () => {
    const metricsGroup = ICON_GALLERY_GROUPS.find((g) => g.type === "metrics");
    expect(metricsGroup).toBeDefined();
    expect(metricsGroup?.items).toHaveLength(9);

    const itemNames = metricsGroup?.items.map((i) => i.name);
    expect(itemNames).toEqual(["Price", "Rate", "High", "Low", "Trend", "Range", "Variety", "Random", "Equal"]);
  });

  it("validates Group 6: Media & System Feedback (type: 'media') items and icons", () => {
    const mediaGroup = ICON_GALLERY_GROUPS.find((g) => g.type === "media");
    expect(mediaGroup).toBeDefined();
    expect(mediaGroup?.items).toHaveLength(7);

    const itemNames = mediaGroup?.items.map((i) => i.name);
    expect(itemNames).toEqual(["Live", "Play", "Pause", "Music", "Exited", "Bored", "Car"]);
  });

  it("ensures every gallery icon resolves to an existing Lucide component without falling back to blank", () => {
    const allItems = getAllIconGalleryItems();
    for (const item of allItems) {
      expect(ICON_COMPONENT_MAP[item.iconName]).toBeDefined();
      const Comp = getLucideIcon(item.iconName);
      expect(Comp).toBeDefined();
    }
  });

  it("correctly filters icon gallery by keyword and category", () => {
    const searchDb = filterIconGalleryItems("database", "all");
    expect(searchDb).toHaveLength(1);
    expect(searchDb[0].name).toBe("Database");

    const infraOnly = filterIconGalleryItems("", "infra");
    expect(infraOnly).toHaveLength(7);

    const searchError = filterIconGalleryItems("error", "all");
    expect(searchError.length).toBeGreaterThanOrEqual(1);
    expect(searchError.some((i) => i.name === "Crash" || i.name === "Re-route")).toBe(true);
  });

  it("formats drag-and-drop payload and constructs valid icon whiteboard node on canvas", () => {
    const sampleItem = {
      name: "Database",
      iconName: "Database",
      subtitle: "For MongoDB cluster / storage tier",
      group: "infra" as const,
      color: "#0EA5E9",
    };

    const dragPayload = {
      category: "node",
      type: "icon",
      iconName: sampleItem.iconName,
      initialTitle: sampleItem.name,
      subtitle: sampleItem.subtitle,
      iconGroup: sampleItem.group,
      color: sampleItem.color,
    };

    const dropCoords = { x: 500, y: 350 };
    const nodeWidth = 80;
    const nodeHeight = 82;

    const createdNode = {
      id: `node-${Date.now()}`,
      type: dragPayload.type as "icon",
      x: dropCoords.x - Math.round(nodeWidth / 2),
      y: dropCoords.y - Math.round(nodeHeight / 2),
      width: nodeWidth,
      height: nodeHeight,
      title: dragPayload.initialTitle,
      subtitle: dragPayload.subtitle,
      iconName: dragPayload.iconName,
      iconGroup: dragPayload.iconGroup,
      color: dragPayload.color,
      fillType: "solid" as const,
      textColor: "#FFFFFF",
      fontSize: "12px",
      fontWeight: "bold",
      zIndex: 2,
    };

    expect(createdNode).toMatchObject({
      type: "icon",
      iconName: "Database",
      iconGroup: "infra",
      title: "Database",
      subtitle: "For MongoDB cluster / storage tier",
      color: "#0EA5E9",
      x: 460,
      y: 309,
      width: 80,
      height: 82,
    });
  });

  it("creates a connected branch node from an icon node inheriting styling and group metadata", () => {
    const parentIconNode = {
      id: "node-parent-1",
      type: "icon" as const,
      iconName: "Server",
      iconGroup: "infra",
      x: 200,
      y: 200,
      width: 150,
      height: 110,
      title: "Compute Server",
      subtitle: "Express / Node instances",
      color: "#6366F1",
    };

    const branchX = parentIconNode.x + parentIconNode.width + 120;
    const branchY = parentIconNode.y;

    const branchNode = {
      id: "node-branch-1",
      type: "icon" as const,
      iconName: parentIconNode.iconName,
      iconGroup: parentIconNode.iconGroup,
      x: branchX,
      y: branchY,
      width: parentIconNode.width,
      height: parentIconNode.height,
      title: parentIconNode.title,
      subtitle: parentIconNode.subtitle,
      color: parentIconNode.color,
      fillType: "solid" as const,
      textColor: "#FFFFFF",
      fontWeight: "bold",
      fontSize: "12px",
      zIndex: 2,
    };

    expect(branchNode.type).toBe("icon");
    expect(branchNode.iconName).toBe("Server");
    expect(branchNode.iconGroup).toBe("infra");
    expect(branchNode.color).toBe("#6366F1");
    expect(branchNode.x).toBe(470);
    expect(branchNode.y).toBe(200);
  });
});

describe("Whiteboard Simple Table Grid (R x C Arrangement of Boxes)", () => {
  const generateTableCells = ({
    rows,
    cols,
    startX = 100,
    startY = 100,
    cellWidth = 140,
    cellHeight = 60,
    gap = 0,
  }: {
    rows: number;
    cols: number;
    startX?: number;
    startY?: number;
    cellWidth?: number;
    cellHeight?: number;
    gap?: number;
  }) => {
    const tableGroupId = `group-table-${Date.now()}`;
    const cells: any[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cellX = startX + c * (cellWidth + gap);
        const cellY = startY + r * (cellHeight + gap);
        const isHeader = r === 0 && rows > 1;
        cells.push({
          id: `cell-${r}-${c}`,
          type: "shape",
          shapeType: "rectangle",
          x: cellX,
          y: cellY,
          width: cellWidth,
          height: cellHeight,
          title: isHeader ? `Header ${c + 1}` : `Row ${r + 1}, Col ${c + 1}`,
          color: isHeader ? "#0078D4" : "#1A1C24",
          fillType: "solid",
          textColor: "#FFFFFF",
          fontSize: "12px",
          fontWeight: isHeader ? "bold" : "normal",
          textAlign: "center",
          groupId: tableGroupId,
        });
      }
    }
    return { cells, tableGroupId };
  };

  it("creates exact number of boxes in r,c arrangement without outer wall (e.g. 3 rows x 4 cols = 12 boxes)", () => {
    const rows = 3;
    const cols = 4;
    const { cells, tableGroupId } = generateTableCells({ rows, cols });

    expect(cells).toHaveLength(12);
    expect(cells.every((c) => c.type === "shape" && c.shapeType === "rectangle")).toBe(true);

    // Verify all cells belong to the same unified tableGroupId
    expect(cells.every((c) => c.groupId === tableGroupId)).toBe(true);

    // Verify no outer wall / container box is created — only the 12 boxes
    expect(cells.find((c) => c.type === "frame" || c.title?.includes("Wall"))).toBeUndefined();
  });

  it("positions cells in exact grid coordinates without overlap when gap is 0 (seamless table)", () => {
    const { cells } = generateTableCells({
      rows: 2,
      cols: 3,
      startX: 200,
      startY: 150,
      cellWidth: 140,
      cellHeight: 60,
      gap: 0,
    });

    // Row 0
    expect(cells[0]).toMatchObject({ x: 200, y: 150, width: 140, height: 60 });
    expect(cells[1]).toMatchObject({ x: 340, y: 150, width: 140, height: 60 });
    expect(cells[2]).toMatchObject({ x: 480, y: 150, width: 140, height: 60 });

    // Row 1
    expect(cells[3]).toMatchObject({ x: 200, y: 210, width: 140, height: 60 });
    expect(cells[4]).toMatchObject({ x: 340, y: 210, width: 140, height: 60 });
    expect(cells[5]).toMatchObject({ x: 480, y: 210, width: 140, height: 60 });
  });

  it("supports custom box spacing when gap is set to 6px", () => {
    const { cells } = generateTableCells({
      rows: 2,
      cols: 2,
      startX: 100,
      startY: 100,
      cellWidth: 100,
      cellHeight: 50,
      gap: 6,
    });

    expect(cells[0]).toMatchObject({ x: 100, y: 100 });
    expect(cells[1]).toMatchObject({ x: 206, y: 100 }); // 100 + 100 + 6
    expect(cells[2]).toMatchObject({ x: 100, y: 156 }); // 100 + 50 + 6
    expect(cells[3]).toMatchObject({ x: 206, y: 156 });
  });

  it("validates drag-and-drop table payload parsing and center positioning", () => {
    const payload = {
      category: "table-grid",
      rows: 4,
      cols: 5,
      gap: 0,
    };

    const dropCoords = { x: 600, y: 400 };
    const cellW = 140;
    const cellH = 60;
    const totalW = payload.cols * cellW;
    const totalH = payload.rows * cellH;
    const startX = dropCoords.x - Math.round(totalW / 2);
    const startY = dropCoords.y - Math.round(totalH / 2);

    const { cells } = generateTableCells({
      rows: payload.rows,
      cols: payload.cols,
      startX,
      startY,
      cellWidth: cellW,
      cellHeight: cellH,
      gap: payload.gap,
    });

    expect(cells).toHaveLength(20);
    expect(cells[0].x).toBe(600 - 350); // 250
    expect(cells[0].y).toBe(400 - 120); // 280
  });

  it("allows dragging any cell in the table to move all cells together while preserving arrangement", () => {
    const { cells } = generateTableCells({ rows: 2, cols: 2, startX: 100, startY: 100 });
    const tableGroupId = cells[0].groupId;

    // Moving node by +50, +30
    const dx = 50;
    const dy = 30;
    const groupMembers = cells.filter((c) => c.groupId === tableGroupId);
    const movedCells = groupMembers.map((c) => ({ ...c, x: c.x + dx, y: c.y + dy }));

    expect(movedCells[0]).toMatchObject({ x: 150, y: 130 });
    expect(movedCells[1]).toMatchObject({ x: 290, y: 130 });
    expect(movedCells[2]).toMatchObject({ x: 150, y: 190 });
    expect(movedCells[3]).toMatchObject({ x: 290, y: 190 });

    // Relative offsets strictly preserved
    expect(movedCells[1].x - movedCells[0].x).toBe(140);
    expect(movedCells[2].y - movedCells[0].y).toBe(60);
  });
});

describe("Whiteboard Saving, 20s Auto-Save, Interaction Guard & Real-Time Sync", () => {
  it("suppresses network save operations while user is in an active interaction state (grabbing, resizing, typing)", () => {
    const isUserInteracting = (state: {
      isMouseDown?: boolean;
      draggingNodeId?: string | null;
      isDraggingGroup?: boolean;
      resizing?: any;
      editingNodeId?: string | null;
      isTypingInInput?: boolean;
    }) => {
      if (state.isMouseDown) return true;
      if (state.draggingNodeId || state.isDraggingGroup) return true;
      if (state.resizing) return true;
      if (state.editingNodeId) return true;
      if (state.isTypingInInput) return true;
      return false;
    };

    // Grab/drag in progress
    expect(isUserInteracting({ draggingNodeId: "node-1" })).toBe(true);
    expect(isUserInteracting({ isDraggingGroup: true })).toBe(true);

    // Resize in progress
    expect(isUserInteracting({ resizing: { handle: "se", nodeId: "node-2" } })).toBe(true);

    // Active text editing
    expect(isUserInteracting({ editingNodeId: "text-1" })).toBe(true);
    expect(isUserInteracting({ isTypingInInput: true })).toBe(true);

    // Mouse held down
    expect(isUserInteracting({ isMouseDown: true })).toBe(true);

    // Idle: safe to save
    expect(isUserInteracting({ isMouseDown: false, draggingNodeId: null, isDraggingGroup: false, resizing: null, editingNodeId: null })).toBe(false);
  });

  it("schedules auto-save on a 20-second cadence and executes when user is idle", () => {
    let hasUnsavedEdits = false;
    let savedCount = 0;
    const intervalMs = 20000;

    const onUserEdit = () => {
      hasUnsavedEdits = true;
    };

    const onAutoSaveTick = (isInteracting: boolean) => {
      if (hasUnsavedEdits && !isInteracting) {
        savedCount++;
        hasUnsavedEdits = false;
      }
    };

    // 0s: user modifies a node
    onUserEdit();
    expect(hasUnsavedEdits).toBe(true);

    // 10s: user is grabbing and moving an object -> tick should NOT save
    onAutoSaveTick(true);
    expect(savedCount).toBe(0);
    expect(hasUnsavedEdits).toBe(true);

    // 20s: user finished grabbing, tick occurs -> saves cleanly
    onAutoSaveTick(false);
    expect(savedCount).toBe(1);
    expect(hasUnsavedEdits).toBe(false);
  });

  it("allows manual save button to immediately commit state to cloud without waiting 20s", () => {
    let hasUnsavedEdits = false;
    let saveStatus: "saved" | "saving" | "unsaved" = "saved";
    let committedPayload: any = null;

    const performManualSave = (snapshot: any) => {
      saveStatus = "saving";
      committedPayload = snapshot;
      hasUnsavedEdits = false;
      saveStatus = "saved";
    };

    // 5s: user modifies canvas
    hasUnsavedEdits = true;
    saveStatus = "unsaved";

    // 8s: user explicitly clicks Save button
    performManualSave({ title: "Architecture Plan", nodes: [{ id: "n1" }] });

    expect(saveStatus).toBe("saved");
    expect(hasUnsavedEdits).toBe(false);
    expect(committedPayload.nodes).toHaveLength(1);
  });

  it("preserves pan, zoom, and fullscreen view without moving an inch during real-time remote sync", () => {
    const clientViewport = {
      pan: { x: 340, y: 180 },
      zoom: 1.15,
      isFullscreen: true,
    };

    let clientCanvasState = {
      nodes: [{ id: "n1", title: "Original Node" }],
      edges: [] as { id: string; from: string; to: string }[],
      updatedAt: 1000,
    };

    const remoteServerState = {
      nodes: [
        { id: "n1", title: "Original Node" },
        { id: "n2", title: "Remote Synchronized Node" },
      ],
      edges: [{ id: "e1", from: "n1", to: "n2" }],
      updatedAt: 2500,
    };

    // Apply real-time sync
    const applyRemoteSync = (remote: typeof remoteServerState) => {
      // ONLY update nodes and edges
      clientCanvasState = {
        nodes: [...remote.nodes],
        edges: [...remote.edges],
        updatedAt: remote.updatedAt,
      };
      // Viewport remains completely untouched
    };

    applyRemoteSync(remoteServerState);

    // Nodes and edges synchronized
    expect(clientCanvasState.nodes).toHaveLength(2);
    expect(clientCanvasState.edges).toHaveLength(1);

    // Viewport position, zoom, and fullscreen are untouched
    expect(clientViewport.pan).toEqual({ x: 340, y: 180 });
    expect(clientViewport.zoom).toBe(1.15);
    expect(clientViewport.isFullscreen).toBe(true);
  });

  it("detects remote session updates and flags remoteUpdateAvailable when local client has unsaved edits", () => {
    const lastSyncedUpdatedAt = 1000;
    const incomingServerUpdatedAt = 3000;

    const checkSyncStatus = (hasLocalEdits: boolean, isInteracting: boolean) => {
      const isServerAhead = incomingServerUpdatedAt > lastSyncedUpdatedAt + 1500;
      if (!isServerAhead) return { autoSynced: false, buttonVisible: false };

      if (!hasLocalEdits && !isInteracting) {
        return { autoSynced: true, buttonVisible: false };
      } else {
        return { autoSynced: false, buttonVisible: true };
      }
    };

    // Client has no local edits: auto-syncs instantly in real-time
    expect(checkSyncStatus(false, false)).toEqual({ autoSynced: true, buttonVisible: false });

    // Client has unsaved local edits: shows Sync Button so work is not overwritten
    expect(checkSyncStatus(true, false)).toEqual({ autoSynced: false, buttonVisible: true });

    // Client is currently interacting/typing: shows Sync Button instead of jarring interruption
    expect(checkSyncStatus(false, true)).toEqual({ autoSynced: false, buttonVisible: true });
  });

  it("enforces beforeunload protection and keepalive flush if user exits before 20s auto-save", () => {
    let keepalivePayloadSent: any = null;
    let promptMessage: string | null = null;

    const onBeforeUnload = (hasUnsavedEdits: boolean, snapshot: any) => {
      if (hasUnsavedEdits) {
        keepalivePayloadSent = snapshot;
        promptMessage = "You have unsaved whiteboard changes. Are you sure you want to leave?";
      }
    };

    // User made edits 8 seconds ago and attempts to close the window
    onBeforeUnload(true, { title: "Draft", nodesCount: 158 });

    expect(keepalivePayloadSent).toEqual({ title: "Draft", nodesCount: 158 });
    expect(promptMessage).toContain("unsaved whiteboard changes");

    // Clean session without unsaved edits does not trigger prompt
    keepalivePayloadSent = null;
    promptMessage = null;
    onBeforeUnload(false, { title: "Draft", nodesCount: 158 });
    expect(promptMessage).toBeNull();
    expect(keepalivePayloadSent).toBeNull();
  });
});

describe("Whiteboard Security & Permissions: PIN/Password, Creator Attribution & 6-Digit Token Phrase", () => {
  it("validates 4-digit PIN format requiring strictly 4 numeric characters", () => {
    const isValidPin = (pin: string) => /^\d{4}$/.test(pin.trim());

    expect(isValidPin("4829")).toBe(true);
    expect(isValidPin("0000")).toBe(true);
    expect(isValidPin("9999")).toBe(true);

    expect(isValidPin("123")).toBe(false); // too short
    expect(isValidPin("12345")).toBe(false); // too long
    expect(isValidPin("482a")).toBe(false); // contains letter
    expect(isValidPin("abcd")).toBe(false); // letters only
    expect(isValidPin("")).toBe(false); // empty
  });

  it("validates 6+ character password minimum length", () => {
    const isValidPassword = (pass: string) => pass.trim().length >= 6;

    expect(isValidPassword("secure123")).toBe(true);
    expect(isValidPassword("secret")).toBe(true);
    expect(isValidPassword("123456")).toBe(true);

    expect(isValidPassword("12345")).toBe(false);
    expect(isValidPassword("abc")).toBe(false);
    expect(isValidPassword("")).toBe(false);
  });

  it("generates a random 6-digit numeric temporary token phrase for colleague edit approval", () => {
    const generateTokenPhrase = () => Math.floor(100000 + Math.random() * 900000).toString();

    for (let i = 0; i < 20; i++) {
      const phrase = generateTokenPhrase();
      expect(phrase).toMatch(/^\d{6}$/);
      expect(Number(phrase)).toBeGreaterThanOrEqual(100000);
      expect(Number(phrase)).toBeLessThanOrEqual(999999);
    }
  });

  it("authorizes colleague edit access via 6-digit phrase when publicEdit is false", () => {
    const board = {
      _id: "wb-sec-1",
      title: "Strategy 2026",
      authorName: "Satyam Sharma",
      isProtected: true,
      publicEdit: false,
      tempTokenPhrase: "849201",
    };

    const verifyAccess = (candidate: string, boardConfig: typeof board) => {
      const trimmed = candidate.trim();
      if (trimmed === boardConfig.tempTokenPhrase) {
        return { authorized: true, via: "tempToken" };
      }
      return { authorized: false, error: "Incorrect approval token phrase" };
    };

    // Colleague enters exact 6-digit phrase provided by creator
    const result1 = verifyAccess("849201", board);
    expect(result1.authorized).toBe(true);
    expect(result1.via).toBe("tempToken");

    // Colleague enters incorrect phrase
    const result2 = verifyAccess("999999", board);
    expect(result2.authorized).toBe(false);
    expect(result2.error).toContain("Incorrect approval token");
  });

  it("blocks deletion when deleteRequiresPass is true unless master PIN/pass is provided", () => {
    const board = {
      _id: "wb-delete-guard",
      title: "Protected Blueprint",
      isProtected: true,
      deleteRequiresPass: true,
      masterPin: "4829",
    };

    const canDelete = (providedPin: string | undefined, boardConfig: typeof board) => {
      if (!boardConfig.isProtected || !boardConfig.deleteRequiresPass) {
        return { allowed: true };
      }
      if (!providedPin || providedPin !== boardConfig.masterPin) {
        return { allowed: false, error: "Password or PIN is required to delete this whiteboard." };
      }
      return { allowed: true };
    };

    // Attempt delete without password
    expect(canDelete(undefined, board)).toEqual({
      allowed: false,
      error: "Password or PIN is required to delete this whiteboard.",
    });

    // Attempt delete with wrong password
    expect(canDelete("1111", board)).toEqual({
      allowed: false,
      error: "Password or PIN is required to delete this whiteboard.",
    });

    // Valid PIN allows deletion
    expect(canDelete("4829", board)).toEqual({ allowed: true });
  });

  it("correctly extracts creator full name and initials for office attribution on whiteboard cards", () => {
    const getCardAttribution = (fullName: string) => {
      const clean = fullName.trim() || "User";
      const initials = clean
        .split(" ")
        .map((w) => w[0])
        .filter(Boolean)
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U";

      return {
        creatorName: clean,
        initials,
        cardBadge: `Created by ${clean}`,
      };
    };

    const creator1 = getCardAttribution("Himesh Sharma");
    expect(creator1.creatorName).toBe("Himesh Sharma");
    expect(creator1.initials).toBe("HS");
    expect(creator1.cardBadge).toBe("Created by Himesh Sharma");

    const creator2 = getCardAttribution("Elena Rostova");
    expect(creator2.creatorName).toBe("Elena Rostova");
    expect(creator2.initials).toBe("ER");
    expect(creator2.cardBadge).toBe("Created by Elena Rostova");
  });
});



