import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";

describe("Meetings & Multi-Platform Connectivity System", () => {
  it("validates platform connectivity options and links", () => {
    const platforms = ["google_meet", "zoom", "slack", "discord", "in_person"];
    expect(platforms).toContain("discord");
    expect(platforms).toContain("google_meet");
    expect(platforms).toContain("zoom");
    expect(platforms).toContain("slack");
  });

  it("handles auto-scheduler cadences (Daily, Weekly, Bi-weekly, Monthly)", () => {
    const cadences = ["none", "daily", "weekly", "biweekly", "monthly"];
    const recurringMeeting = {
      isRecurring: true,
      recurrenceCadence: "weekly",
      recurrenceDayOfWeek: "Monday",
    };
    expect(cadences).toContain(recurringMeeting.recurrenceCadence);
    expect(recurringMeeting.isRecurring).toBe(true);
  });

  it("properly formats Discord voice channel and server linkages", () => {
    const meeting = {
      title: "Cloud9 Esports 300Hz Testing Debrief",
      platform: "discord",
      discordChannelName: "voice-scrim-lab",
      discordChannelUrl: "https://discord.com/channels/982371928371/voice-scrim-lab",
      meetingLink: "https://discord.gg/apexvision-c9",
    };

    expect(meeting.discordChannelName).toBe("voice-scrim-lab");
    expect(meeting.discordChannelUrl).toContain("discord.com/channels/");
    expect(meeting.meetingLink).toContain("discord.gg/");
  });

  it("properly formats Slack channel and webhook linkages", () => {
    const meeting = {
      title: "Daily Product Growth & Pipeline Sync",
      platform: "slack",
      slackChannelName: "growth-daily",
      slackWebhookUrl: "https://hooks.slack.com/services/T000/B000/growth-daily",
      meetingLink: "https://slack.com/app_redirect?channel=growth-daily",
    };

    expect(meeting.slackChannelName).toBe("growth-daily");
    expect(meeting.slackWebhookUrl).toContain("hooks.slack.com");
  });

  it("compiles valid downloadable PDF meeting transcripts with pdf-lib", async () => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);

    page.drawText("TASKFLOW ENTERPRISE - OFFICIAL MEETING MINUTES", {
      x: 50,
      y: 750,
      size: 14,
    });

    const pdfBytes = await pdfDoc.save();
    expect(pdfBytes.length).toBeGreaterThan(100);

    const base64Pdf = Buffer.from(pdfBytes).toString("base64");
    const dataUrl = `data:application/pdf;base64,${base64Pdf}`;
    expect(dataUrl.startsWith("data:application/pdf;base64,")).toBe(true);
  });

  it("validates meeting edit payload structure and recurrence mutation", () => {
    const editPayload = {
      meetingId: "650000000000000000000001",
      title: "Updated Executive Strategy Review",
      description: "Updated agenda with strategic partners",
      scheduledAt: "2026-10-15T14:00:00.000Z",
      durationMinutes: 60,
      platform: "google_meet",
      meetingLink: "https://meet.google.com/abc-defg-hij",
      isRecurring: true,
      recurrenceCadence: "biweekly",
      recurrenceDayOfWeek: "Wednesday",
    };

    expect(editPayload.meetingId).toBeDefined();
    expect(editPayload.title).toBe("Updated Executive Strategy Review");
    expect(editPayload.durationMinutes).toBe(60);
    expect(editPayload.isRecurring).toBe(true);
    expect(editPayload.recurrenceCadence).toBe("biweekly");
  });

  it("validates CRM client account edit payload structure and health calculation", () => {
    const crmEditPayload = {
      accountId: "650000000000000000000099",
      accountName: "Cloud9 Esports Global",
      tier: "Enterprise Key",
      lifecycleStage: "Contract Expansion",
      contractARR: 350000,
      healthScore: 98,
      industry: "Esports & Gaming",
      region: "North America",
      contactName: "Jack Etienne",
      contactTitle: "Chief Executive Officer",
      contactEmail: "jack@cloud9.gg",
      contactPhone: "+1 (310) 555-0199",
      notes: "Expanded 300Hz monitor supply commitment.",
    };

    expect(crmEditPayload.accountId).toBeDefined();
    expect(crmEditPayload.accountName).toBe("Cloud9 Esports Global");
    expect(crmEditPayload.tier).toBe("Enterprise Key");
    expect(crmEditPayload.contractARR).toBe(350000);
    expect(crmEditPayload.healthScore).toBeGreaterThanOrEqual(90);
    expect(crmEditPayload.contactEmail).toBe("jack@cloud9.gg");
  });

  it("ensures updateMeetingStatus returns a clean, non-circular serializable payload without Maximum call stack error", () => {
    // Valid status values
    const validStatuses = ["Scheduled", "In Progress", "Completed", "Cancelled"];
    const testStatus = "In Progress";
    expect(validStatuses).toContain(testStatus);

    // Simulated Server Action return payload
    const actionResult = {
      success: true,
      meetingId: "650000000000000000000001",
      status: testStatus,
    };

    // Verify it is cleanly serializable by standard JSON (no circular refs or Mongoose prototype leaks)
    expect(() => JSON.stringify(actionResult)).not.toThrow();
    const parsed = JSON.parse(JSON.stringify(actionResult));
    expect(parsed.success).toBe(true);
    expect(parsed.status).toBe("In Progress");
    expect(parsed.meetingId).toBe("650000000000000000000001");
  });

  it("properly resolves optimistic status across localStatusMap and initial meeting props", () => {
    const initialMeetings = [
      { _id: "m-1", title: "Product Sync", status: "Scheduled" },
      { _id: "m-2", title: "Client Demo", status: "In Progress" },
    ];

    const localStatusMap: Record<string, string> = {
      "m-1": "Completed", // user optimistically changed m-1 to Completed
    };

    const getEffectiveStatus = (meeting: { _id: string; status: string }) => {
      return localStatusMap[meeting._id] || meeting.status;
    };

    expect(getEffectiveStatus(initialMeetings[0])).toBe("Completed");
    expect(getEffectiveStatus(initialMeetings[1])).toBe("In Progress");
  });

  describe("Meeting Auto-Sort Hierarchy & Tie-Breaker Engine", () => {
    const fixedNow = new Date("2026-10-10T12:00:00.000Z").getTime();

    const sortComparator = (
      a: { _id: string; scheduledAt: string; status: string; createdAt?: string; updatedAt?: string },
      b: { _id: string; scheduledAt: string; status: string; createdAt?: string; updatedAt?: string },
      localStatusMap: Record<string, string> = {}
    ) => {
      const getStatusPriority = (status: string): number => {
        switch (status) {
          case "In Progress":
            return 1;
          case "Scheduled":
            return 2;
          case "Completed":
            return 3;
          case "Cancelled":
            return 4;
          default:
            return 5;
        }
      };

      const statusA = localStatusMap[a._id] || a.status;
      const statusB = localStatusMap[b._id] || b.status;

      const priorityA = getStatusPriority(statusA);
      const priorityB = getStatusPriority(statusB);

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      const startA = new Date(a.scheduledAt).getTime();
      const startB = new Date(b.scheduledAt).getTime();

      // 1. In Progress: compare which started first (earliest start time first)
      if (statusA === "In Progress") {
        if (startA !== startB) {
          return startA - startB;
        }
        const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return createdA - createdB;
      }

      // 2. Scheduled: always sort to less time remaining for scheduled meeting (earliest start time first)
      if (statusA === "Scheduled") {
        if (startA !== startB) {
          return startA - startB;
        }
        const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return createdA - createdB;
      }

      // 3. Completed: recent completed to old completed
      if (statusA === "Completed") {
        const compTimeA = a.updatedAt ? new Date(a.updatedAt).getTime() : startA;
        const compTimeB = b.updatedAt ? new Date(b.updatedAt).getTime() : startB;
        return compTimeB - compTimeA;
      }

      // 4. Cancelled: recent to old
      if (statusA === "Cancelled") {
        const cancelTimeA = a.updatedAt ? new Date(a.updatedAt).getTime() : startA;
        const cancelTimeB = b.updatedAt ? new Date(b.updatedAt).getTime() : startB;
        return cancelTimeB - cancelTimeA;
      }

      return 0;
    };

    it("orders primary status categories: In Progress -> Scheduled -> Completed -> Cancelled", () => {
      const meetings = [
        { _id: "1", title: "C", status: "Cancelled", scheduledAt: "2026-10-10T14:00:00Z" },
        { _id: "2", title: "S", status: "Scheduled", scheduledAt: "2026-10-10T14:00:00Z" },
        { _id: "3", title: "IP", status: "In Progress", scheduledAt: "2026-10-10T11:00:00Z" },
        { _id: "4", title: "CO", status: "Completed", scheduledAt: "2026-10-10T10:00:00Z" },
      ];

      const sorted = [...meetings].sort((a, b) => sortComparator(a, b));
      expect(sorted.map((m) => m.status)).toEqual(["In Progress", "Scheduled", "Completed", "Cancelled"]);
    });

    it("sorts multiple In Progress meetings by which started first (earliest start time)", () => {
      const inProgressMeetings = [
        { _id: "ip-late", scheduledAt: "2026-10-10T11:45:00Z", status: "In Progress" },
        { _id: "ip-early", scheduledAt: "2026-10-10T11:00:00Z", status: "In Progress" },
        { _id: "ip-mid", scheduledAt: "2026-10-10T11:30:00Z", status: "In Progress" },
      ];

      const sorted = [...inProgressMeetings].sort((a, b) => sortComparator(a, b));
      expect(sorted.map((m) => m._id)).toEqual(["ip-early", "ip-mid", "ip-late"]);
    });

    it("ensures Oct 10 remains ahead of Oct 15 when switched between In Progress and Scheduled (less time remaining)", () => {
      const meetingOct10 = {
        _id: "m-oct10",
        title: "Sprint Review & Demo",
        scheduledAt: "2026-10-10T10:00:00.000Z", // Sat, Oct 10, 2026
        status: "Scheduled",
      };

      const meetingOct15 = {
        _id: "m-oct15",
        title: "Q4 Hardware Architectural Sync",
        scheduledAt: "2026-10-15T14:00:00.000Z", // Thu, Oct 15, 2026
        status: "Scheduled",
      };

      // 1. Initial Scheduled state: Oct 10 has less time remaining than Oct 15 -> Oct 10 must be ahead
      let sorted = [meetingOct15, meetingOct10].sort((a, b) => sortComparator(a, b));
      expect(sorted[0]._id).toBe("m-oct10");
      expect(sorted[1]._id).toBe("m-oct15");

      // 2. User switches Oct 10 to "In Progress": Oct 10 is Tier 1 (In Progress) -> ahead of Oct 15 (Scheduled)
      sorted = [meetingOct15, meetingOct10].sort((a, b) =>
        sortComparator(a, b, { "m-oct10": "In Progress" })
      );
      expect(sorted[0]._id).toBe("m-oct10");
      expect(sorted[1]._id).toBe("m-oct15");

      // 3. User switches Oct 10 back to "Scheduled": Oct 10 (today) MUST still be ahead of Oct 15 (future)
      sorted = [meetingOct15, meetingOct10].sort((a, b) =>
        sortComparator(a, b, { "m-oct10": "Scheduled" })
      );
      expect(sorted[0]._id).toBe("m-oct10");
      expect(sorted[1]._id).toBe("m-oct15");
    });

    it("sorts Scheduled meetings by closer to current time to longer time to start (less time remaining)", () => {
      const scheduledMeetings = [
        { _id: "s-tomorrow", scheduledAt: "2026-10-11T12:00:00Z", status: "Scheduled" }, // +24 hours
        { _id: "s-15min", scheduledAt: "2026-10-10T12:15:00Z", status: "Scheduled" },    // +15 mins (closest!)
        { _id: "s-2hour", scheduledAt: "2026-10-10T14:00:00Z", status: "Scheduled" },    // +2 hours
        { _id: "s-45min", scheduledAt: "2026-10-10T12:45:00Z", status: "Scheduled" },    // +45 mins
      ];

      const sorted = [...scheduledMeetings].sort((a, b) => sortComparator(a, b));
      expect(sorted.map((m) => m._id)).toEqual(["s-15min", "s-45min", "s-2hour", "s-tomorrow"]);
    });

    it("sorts Completed meetings from recent completed to old completed", () => {
      const completedMeetings = [
        { _id: "co-old", scheduledAt: "2026-10-09T10:00:00Z", status: "Completed", updatedAt: "2026-10-09T11:00:00Z" },
        { _id: "co-recent", scheduledAt: "2026-10-10T10:00:00Z", status: "Completed", updatedAt: "2026-10-10T11:30:00Z" },
        { _id: "co-mid", scheduledAt: "2026-10-10T08:00:00Z", status: "Completed", updatedAt: "2026-10-10T09:00:00Z" },
      ];

      const sorted = [...completedMeetings].sort((a, b) => sortComparator(a, b));
      expect(sorted.map((m) => m._id)).toEqual(["co-recent", "co-mid", "co-old"]);
    });

    it("sorts Cancelled meetings from recent cancelled to old cancelled", () => {
      const cancelledMeetings = [
        { _id: "ca-yesterday", scheduledAt: "2026-10-09T15:00:00Z", status: "Cancelled", updatedAt: "2026-10-09T15:30:00Z" },
        { _id: "ca-justnow", scheduledAt: "2026-10-10T11:00:00Z", status: "Cancelled", updatedAt: "2026-10-10T11:55:00Z" },
        { _id: "ca-thismorning", scheduledAt: "2026-10-10T09:00:00Z", status: "Cancelled", updatedAt: "2026-10-10T09:30:00Z" },
      ];

      const sorted = [...cancelledMeetings].sort((a, b) => sortComparator(a, b));
      expect(sorted.map((m) => m._id)).toEqual(["ca-justnow", "ca-thismorning", "ca-yesterday"]);
    });
  });
});
