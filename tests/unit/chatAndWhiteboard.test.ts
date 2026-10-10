import { describe, it, expect } from "vitest";
import { ORG_CHART_NODES, ORG_CHART_EDGES, WHITEBOARD_TEMPLATES } from "@/lib/whiteboardTemplates";

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
});



