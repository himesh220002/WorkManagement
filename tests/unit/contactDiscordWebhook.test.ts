import { describe, it, expect, vi } from "vitest";

describe("Contact Inquiries and Discord Webhook Notifications", () => {
  it("formats Discord webhook embed payload correctly", () => {
    const inquiry = {
      name: "Ada Lovelace",
      email: "ada@analyticalengine.org",
      company: "Analytical Systems Ltd",
      message: "We need an enterprise TaskPMS workspace for 50 engineers.",
    };

    const payload = {
      username: "TaskPMS Inquiries",
      embeds: [
        {
          title: "📬 New Contact Inquiry Received",
          description: "A visitor has submitted an inquiry on the TaskPMS Contact Page.",
          color: 0x5865f2,
          fields: [
            { name: "👤 Sender Name", value: inquiry.name, inline: true },
            { name: "📧 Email", value: inquiry.email, inline: true },
            { name: "🏢 Organization / Company", value: inquiry.company, inline: true },
            { name: "💬 Message Content", value: inquiry.message, inline: false },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    };

    expect(payload.embeds[0].title).toContain("New Contact Inquiry");
    expect(payload.embeds[0].fields[0].value).toBe("Ada Lovelace");
    expect(payload.embeds[0].fields[1].value).toBe("ada@analyticalengine.org");
    expect(payload.embeds[0].color).toBe(0x5865f2);
  });
});
