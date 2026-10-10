import connectToDatabase from "@/lib/mongodb";
import { Meeting, Project, ClientAccount, User } from "@/models";
import { getCurrentSession, getTenantQueryFilter } from "@/server/auth/session";
import { fetchWithCache } from "@/lib/cache";
import MeetingsClient from "./MeetingsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Meetings & Discussions | TaskFlow",
  description:
    "Company auto-scheduler, cross-platform meeting connectivity (Google Meet, Zoom, Slack, Discord), and meeting transcript minutes.",
};

export default async function MeetingsPage() {
  await connectToDatabase();
  const session = await getCurrentSession();
  const tenantFilter = getTenantQueryFilter(session);
  const cId = session.companyId || "default";

  let rawMeetings: any[] = [];
  let rawProjects: any[] = [];
  let rawAccounts: any[] = [];
  let rawUsers: any[] = [];

  try {
    [rawMeetings, rawProjects, rawAccounts, rawUsers] = await Promise.all([
      fetchWithCache(`meetings_list:${cId}`, 15, () =>
        Meeting.find(tenantFilter).sort({ scheduledAt: -1 }).lean()
      ),
      fetchWithCache(`meetings_projects:${cId}`, 30, () =>
        Project.find(tenantFilter, { name: 1 }).lean()
      ),
      fetchWithCache(`meetings_accounts:${cId}`, 30, () =>
        ClientAccount.find(tenantFilter, { accountName: 1, primaryContact: 1 }).lean()
      ),
      fetchWithCache(`meetings_users:${cId}`, 30, () =>
        User.find(tenantFilter, { name: 1, email: 1, role: 1 }).lean()
      ),
    ]);
  } catch (err) {
    console.error("Failed to fetch meetings data:", err);
  }

  const meetings = (rawMeetings || []).map((m: any) => ({
    _id: m._id.toString(),
    title: m.title || "Untitled Meeting",
    description: m.description || "",
    projectId: m.projectId ? m.projectId.toString() : null,
    clientAccountId: m.clientAccountId ? m.clientAccountId.toString() : null,
    clientAccountName: m.clientAccountName || "",
    organizerName: m.organizerName || "Operations Lead",
    organizerEmail: m.organizerEmail || "",
    scheduledAt: m.scheduledAt ? new Date(m.scheduledAt).toISOString() : new Date().toISOString(),
    durationMinutes: m.durationMinutes || 45,
    platform: m.platform || "google_meet",
    meetingLink: m.meetingLink || "",
    discordChannelUrl: m.discordChannelUrl || "",
    discordChannelName: m.discordChannelName || "",
    slackChannelName: m.slackChannelName || "",
    slackWebhookUrl: m.slackWebhookUrl || "",
    attendees: Array.isArray(m.attendees)
      ? m.attendees.map((a: any) => ({
          userId: a.userId ? a.userId.toString() : null,
          name: a.name || "Member",
          email: a.email || "",
          role: a.role || "Member",
          attendanceStatus: a.attendanceStatus || "invited",
        }))
      : [],
    isRecurring: Boolean(m.isRecurring),
    recurrenceCadence: m.recurrenceCadence || "none",
    recurrenceDayOfWeek: m.recurrenceDayOfWeek || "",
    status: m.status || "Scheduled",
    transcript: m.transcript || "",
    transcriptPdfDataUrl: m.transcriptPdfDataUrl || "",
    keyTakeaways: Array.isArray(m.keyTakeaways) ? m.keyTakeaways : [],
    actionItems: Array.isArray(m.actionItems)
      ? m.actionItems.map((item: any) => ({
          text: item.text || "",
          assigneeName: item.assigneeName || "",
          completed: Boolean(item.completed),
        }))
      : [],
    recordingUrl: m.recordingUrl || "",
    createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : undefined,
    updatedAt: m.updatedAt ? new Date(m.updatedAt).toISOString() : undefined,
  }));

  const projects = (rawProjects || []).map((p: any) => ({
    _id: p._id.toString(),
    name: p.name || "Project",
  }));

  const clientAccounts = (rawAccounts || []).map((acc: any) => ({
    _id: acc._id.toString(),
    accountName: acc.accountName || "Account",
    primaryContact: {
      name: acc.primaryContact?.name || "",
      email: acc.primaryContact?.email || "",
    },
  }));

  const users = (rawUsers || []).map((u: any) => ({
    _id: u._id.toString(),
    name: u.name || "User",
    email: u.email || "",
    role: u.role || "Member",
  }));

  return (
    <MeetingsClient
      meetings={meetings}
      projects={projects}
      clientAccounts={clientAccounts}
      users={users}
      isGuest={Boolean(session.isGuest)}
      currentUser={{
        name: session.name || "User",
        email: session.email || "",
        role: session.role || "member",
      }}
    />
  );
}
