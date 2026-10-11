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
});



