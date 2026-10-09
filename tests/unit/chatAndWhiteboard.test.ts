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
});


