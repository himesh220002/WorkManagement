"use server";

import connectToDatabase from "@/lib/mongodb";
import { Meeting, ClientAccount, Project, User } from "@/models";
import { getCurrentSession } from "@/server/auth/session";
import { revalidatePath } from "next/cache";
import { syncTenantWrite } from "@/lib/tenantDb";
import { invalidateAllAppCaches } from "@/lib/cache";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

function assertNotGuest(session: { isGuest?: boolean; userId?: string | null }) {
  if (session.isGuest || !session.userId) {
    throw new Error("Authentication required. Please log in or subscribe to modify meetings.");
  }
}

/**
 * Creates a scheduled or recurring meeting with Google Meet, Zoom, Slack, or Discord linkage.
 */
export async function createMeeting(formData: FormData) {
  await connectToDatabase();
  const session = await getCurrentSession();
  assertNotGuest(session);

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || "";
  const scheduledAtStr = formData.get("scheduledAt") as string;
  const durationMinutes = Number(formData.get("durationMinutes")) || 45;
  const platform = (formData.get("platform") as any) || "google_meet";
  let meetingLink = (formData.get("meetingLink") as string)?.trim();
  const discordChannelUrl = (formData.get("discordChannelUrl") as string)?.trim() || "";
  const discordChannelName = (formData.get("discordChannelName") as string)?.trim() || "";
  const slackChannelName = (formData.get("slackChannelName") as string)?.trim() || "";
  const slackWebhookUrl = (formData.get("slackWebhookUrl") as string)?.trim() || "";
  
  const projectId = (formData.get("projectId") as string)?.trim() || undefined;
  const clientAccountId = (formData.get("clientAccountId") as string)?.trim() || undefined;
  
  const isRecurring = formData.get("isRecurring") === "true" || formData.get("isRecurring") === "on";
  const recurrenceCadence = (formData.get("recurrenceCadence") as any) || (isRecurring ? "weekly" : "none");
  const recurrenceDayOfWeek = (formData.get("recurrenceDayOfWeek") as string)?.trim() || "";

  if (!title) {
    throw new Error("Meeting title is required.");
  }

  // Provide sensible default platform meeting links if not supplied
  if (!meetingLink) {
    const randomCode = Math.random().toString(36).substring(2, 6) + "-" + Math.random().toString(36).substring(2, 6);
    switch (platform) {
      case "zoom":
        meetingLink = `https://zoom.us/j/${Math.floor(1000000000 + Math.random() * 9000000000)}`;
        break;
      case "slack":
        meetingLink = slackChannelName
          ? `https://slack.com/app_redirect?channel=${encodeURIComponent(slackChannelName.replace(/^#/, ""))}`
          : `https://slack.com/huddle/${randomCode}`;
        break;
      case "discord":
        meetingLink = discordChannelUrl || `https://discord.gg/channel/${randomCode}`;
        break;
      case "in_person":
        meetingLink = "HQ Conference Room Alpha";
        break;
      case "google_meet":
      default:
        meetingLink = `https://meet.google.com/${randomCode.slice(0, 3)}-${randomCode.slice(3, 7)}-${randomCode.slice(7, 10) || "pms"}`;
        break;
    }
  }

  // Resolve client account name if linked
  let clientAccountName = "";
  if (clientAccountId) {
    const acc = await ClientAccount.findById(clientAccountId).select("accountName").lean();
    if (acc) clientAccountName = (acc as any).accountName;
  }

  // Parse Attendees (can be passed as comma-separated emails or JSON array)
  const attendeeEmailsRaw = (formData.get("attendeeEmails") as string)?.trim() || "";
  const attendeeNamesRaw = (formData.get("attendeeNames") as string)?.trim() || "";

  const emails = attendeeEmailsRaw ? attendeeEmailsRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const names = attendeeNamesRaw ? attendeeNamesRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const attendees: any[] = [];
  if (emails.length > 0) {
    emails.forEach((email, i) => {
      attendees.push({
        name: names[i] || email.split("@")[0],
        email,
        role: "Attendee",
        attendanceStatus: "invited",
      });
    });
  } else {
    // Add current user by default
    attendees.push({
      name: session.name || "Organizer",
      email: session.email || "organizer@company.internal",
      role: "Host",
      attendanceStatus: "confirmed",
    });
  }

  const scheduledDate = scheduledAtStr ? new Date(scheduledAtStr) : new Date(Date.now() + 2 * 60 * 60 * 1000);

  const meetingDoc = await Meeting.create({
    companyId: session.companyId,
    title,
    description,
    projectId: projectId || undefined,
    clientAccountId: clientAccountId || undefined,
    clientAccountName: clientAccountName || undefined,
    organizerName: session.name || "Operations Lead",
    organizerEmail: session.email || "",
    scheduledAt: scheduledDate,
    durationMinutes,
    platform,
    meetingLink,
    discordChannelUrl,
    discordChannelName,
    slackChannelName,
    slackWebhookUrl,
    attendees,
    isRecurring,
    recurrenceCadence,
    recurrenceDayOfWeek,
    status: "Scheduled",
    transcript: "",
    keyTakeaways: [],
    actionItems: [],
  });

  // Multi-tenant dual write
  if (session.companyCode) {
    await syncTenantWrite("Meeting", "create", meetingDoc, undefined, session.companyCode);
  }

  // If linked to a CRM Client Account, record an interaction
  if (clientAccountId) {
    const interaction = {
      date: scheduledDate,
      type: "Meeting" as const,
      summary: `Scheduled ${title} (${platform.toUpperCase()}) | Link: ${meetingLink}${
        discordChannelName ? ` | Discord: #${discordChannelName}` : ""
      }${slackChannelName ? ` | Slack: #${slackChannelName}` : ""}`,
      recordedBy: session.name || "Organizer",
    };

    await ClientAccount.findByIdAndUpdate(clientAccountId, {
      $push: { interactions: interaction },
      $set: {
        nextAction: {
          action: `Attend ${title} (${platform.toUpperCase()})`,
          dueDate: scheduledDate,
        },
      },
    });

    if (session.companyCode) {
      await syncTenantWrite(
        "ClientAccount",
        "update",
        clientAccountId,
        { $push: { interactions: interaction } },
        session.companyCode
      );
    }
  }

  invalidateAllAppCaches();
  revalidatePath("/teams/meetings");
  revalidatePath("/growth/crm");

  return { success: true, meetingId: meetingDoc._id.toString() };
}

/**
 * Updates meeting lifecycle status (Scheduled, In Progress, Completed, Cancelled)
 */
export async function updateMeetingStatus(meetingId: string, status: string) {
  await connectToDatabase();
  const session = await getCurrentSession();
  assertNotGuest(session);

  const updated = await Meeting.findByIdAndUpdate(
    meetingId,
    { $set: { status } },
    { new: true }
  );

  if (session.companyCode) {
    await syncTenantWrite("Meeting", "update", meetingId, { $set: { status } }, session.companyCode);
  }

  invalidateAllAppCaches();
  revalidatePath("/teams/meetings");
  return { success: true, meeting: updated };
}

/**
 * Updates meeting transcripts, key takeaways, and action items in DB
 */
export async function updateMeetingTranscript(
  meetingId: string,
  transcript: string,
  keyTakeaways: string[],
  actionItems: Array<{ text: string; assigneeName?: string; completed: boolean }>
) {
  await connectToDatabase();
  const session = await getCurrentSession();
  assertNotGuest(session);

  const updateData = {
    transcript,
    keyTakeaways,
    actionItems,
    status: "Completed",
  };

  const meeting = await Meeting.findByIdAndUpdate(
    meetingId,
    { $set: updateData },
    { new: true }
  );

  if (session.companyCode) {
    await syncTenantWrite("Meeting", "update", meetingId, { $set: updateData }, session.companyCode);
  }

  invalidateAllAppCaches();
  revalidatePath("/teams/meetings");
  return { success: true, meeting };
}

/**
 * Generates and stores a PDF transcript for the meeting using pdf-lib
 */
export async function generateMeetingTranscriptPdf(meetingId: string) {
  await connectToDatabase();
  const session = await getCurrentSession();

  const meeting = await Meeting.findById(meetingId).lean();
  if (!meeting) {
    throw new Error("Meeting record not found.");
  }

  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([600, 800]);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let y = 750;

  // Header Banner
  page.drawText("EXECUTIVE MEETING MINUTES & TRANSCRIPT", {
    x: 50,
    y,
    size: 16,
    font: fontBold,
    color: rgb(0, 0.47, 0.83), // #0078D4
  });
  y -= 25;

  page.drawText(`Meeting: ${(meeting as any).title}`, {
    x: 50,
    y,
    size: 13,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 18;

  const dateStr = new Date((meeting as any).scheduledAt).toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  });

  page.drawText(`Date & Time: ${dateStr} | Duration: ${(meeting as any).durationMinutes} min`, {
    x: 50,
    y,
    size: 10,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 16;

  page.drawText(`Platform: ${((meeting as any).platform || "").toUpperCase()} | Link: ${(meeting as any).meetingLink || "N/A"}`, {
    x: 50,
    y,
    size: 10,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 25;

  // Divider line
  page.drawLine({
    start: { x: 50, y },
    end: { x: 550, y },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85),
  });
  y -= 20;

  // Attendees
  page.drawText("CONFIRMED ATTENDEES", {
    x: 50,
    y,
    size: 11,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.2),
  });
  y -= 16;

  const attendeeList = ((meeting as any).attendees || [])
    .map((a: any) => `${a.name} (${a.email})`)
    .join(", ") || "General Attendees";

  page.drawText(attendeeList.slice(0, 95), {
    x: 50,
    y,
    size: 9,
    font: fontRegular,
    color: rgb(0.25, 0.25, 0.25),
  });
  y -= 25;

  // Key Takeaways Section
  if ((meeting as any).keyTakeaways && (meeting as any).keyTakeaways.length > 0) {
    page.drawText("KEY TAKEAWAYS & EXECUTIVE DECISIONS", {
      x: 50,
      y,
      size: 11,
      font: fontBold,
      color: rgb(0.06, 0.49, 0.06), // #107C10
    });
    y -= 16;

    for (const point of (meeting as any).keyTakeaways) {
      page.drawText(`• ${point}`, {
        x: 60,
        y,
        size: 9,
        font: fontRegular,
        color: rgb(0.2, 0.2, 0.2),
      });
      y -= 14;
    }
    y -= 10;
  }

  // Action Items Section
  if ((meeting as any).actionItems && (meeting as any).actionItems.length > 0) {
    page.drawText("ACTION ITEMS & RESPONSIBILITY ASSIGNMENTS", {
      x: 50,
      y,
      size: 11,
      font: fontBold,
      color: rgb(0.8, 0.3, 0.1),
    });
    y -= 16;

    for (const item of (meeting as any).actionItems) {
      const statusIcon = item.completed ? "[DONE]" : "[PENDING]";
      const assignee = item.assigneeName ? `(@${item.assigneeName})` : "";
      page.drawText(`${statusIcon} ${item.text} ${assignee}`, {
        x: 60,
        y,
        size: 9,
        font: fontRegular,
        color: rgb(0.2, 0.2, 0.2),
      });
      y -= 14;
    }
    y -= 10;
  }

  // Discussion Transcript Section
  page.drawText("RECORDED DISCUSSION TRANSCRIPT", {
    x: 50,
    y,
    size: 11,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.2),
  });
  y -= 16;

  const transcript = (meeting as any).transcript || "No raw audio transcript recorded for this session.";
  // Simple word wrapping for PDF output
  const words = transcript.split(/\s+/);
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).length > 85) {
      page.drawText(currentLine, {
        x: 50,
        y,
        size: 9,
        font: fontRegular,
        color: rgb(0.25, 0.25, 0.25),
      });
      y -= 13;
      currentLine = word;

      if (y < 60) {
        page = pdfDoc.addPage([600, 800]);
        y = 750;
      }
    } else {
      currentLine = currentLine ? currentLine + " " + word : word;
    }
  }

  if (currentLine) {
    page.drawText(currentLine, {
      x: 50,
      y,
      size: 9,
      font: fontRegular,
      color: rgb(0.25, 0.25, 0.25),
    });
  }

  const pdfBytes = await pdfDoc.save();
  const base64Pdf = Buffer.from(pdfBytes).toString("base64");
  const dataUrl = `data:application/pdf;base64,${base64Pdf}`;

  // Save dataUrl on meeting record
  await Meeting.findByIdAndUpdate(meetingId, { $set: { transcriptPdfDataUrl: dataUrl } });

  if (session.companyCode) {
    await syncTenantWrite(
      "Meeting",
      "update",
      meetingId,
      { $set: { transcriptPdfDataUrl: dataUrl } },
      session.companyCode
    );
  }

  return { success: true, pdfDataUrl: dataUrl, title: (meeting as any).title || "Meeting" };
}

/**
 * Deletes meeting
 */
export async function deleteMeeting(formData: FormData) {
  await connectToDatabase();
  const session = await getCurrentSession();
  assertNotGuest(session);

  const meetingId = formData.get("meetingId") as string;
  if (!meetingId) throw new Error("Meeting ID required.");

  await Meeting.findByIdAndDelete(meetingId);

  if (session.companyCode) {
    await syncTenantWrite("Meeting", "delete", meetingId, undefined, session.companyCode);
  }

  invalidateAllAppCaches();
  revalidatePath("/teams/meetings");
  revalidatePath("/growth/crm");

  return { success: true };
}
