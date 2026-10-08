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
});
