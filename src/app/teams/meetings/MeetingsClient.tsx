"use client";

import React, { useState, useMemo, useTransition } from "react";
import {
  Video,
  Users,
  Calendar,
  Clock,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  ExternalLink,
  Copy,
  Check,
  MessageSquare,
  Hash,
  Radio,
  Repeat,
  Trash2,
  Edit3,
  Pencil,
  X,
  Sparkles,
  Send,
  Mic,
  Play,
  Briefcase,
  Layers,
  ChevronRight,
  Info,
  ArrowUpDown,
} from "lucide-react";
import {
  createMeeting,
  updateMeeting,
  updateMeetingStatus,
  updateMeetingTranscript,
  generateMeetingTranscriptPdf,
  deleteMeeting,
} from "@/actions/meetings";

interface Attendee {
  userId?: string | null;
  name: string;
  email: string;
  role?: string;
  attendanceStatus?: "invited" | "confirmed" | "attended" | "declined";
}

interface ActionItem {
  text: string;
  assigneeName?: string;
  completed: boolean;
}

export type MeetingPlatform = "google_meet" | "zoom" | "slack" | "discord" | "in_person";

/** Normalizes legacy/variant stored platform values to a canonical id. */
export function normalizeMeetingPlatform(p: unknown): MeetingPlatform {
  const v = String(p || "").toLowerCase();
  if (v.includes("slack") || v.includes("huddle")) return "slack";
  if (v.includes("discord")) return "discord";
  if (v.includes("zoom")) return "zoom";
  if (v.includes("person") || v.includes("office") || v.includes("room") || v === "hq") return "in_person";
  if (v.includes("meet") || v.includes("google")) return "google_meet";
  return "google_meet";
}

/** Provider launcher for the "create link on platform, paste it here" flow. */
export function platformLauncher(p: MeetingPlatform): { url: string; label: string; color: string } | null {
  switch (p) {
    case "google_meet":
      return { url: "https://meet.google.com/new", label: "Create Google Meet Room ↗", color: "bg-emerald-600 hover:bg-emerald-700 text-white" };
    case "zoom":
      return { url: "https://zoom.us/meeting/schedule", label: "Schedule on Zoom ↗", color: "bg-sky-600 hover:bg-sky-700 text-white" };
    case "slack":
      return { url: "https://app.slack.com/", label: "Open Slack App ↗", color: "bg-purple-600 hover:bg-purple-700 text-white" };
    case "discord":
      return { url: "https://discord.com/app", label: "Open Discord & Copy Channel Link ↗", color: "bg-[#5865F2] hover:bg-[#4752C4] text-white" };
    default:
      return null;
  }
}

export function platformDisplayName(p: MeetingPlatform): string {
  switch (p) {
    case "google_meet": return "Google Meet";
    case "zoom": return "Zoom";
    case "slack": return "Slack";
    case "discord": return "Discord";
    default: return "In-Person";
  }
}

export interface MeetingItem {  _id: string;
  title: string;
  description?: string;
  projectId?: string | null;
  clientAccountId?: string | null;
  clientAccountName?: string;
  organizerName: string;
  organizerEmail?: string;
  scheduledAt: string;
  durationMinutes: number;
  platform: "google_meet" | "zoom" | "slack" | "discord" | "in_person";
  meetingLink: string;
  discordChannelUrl?: string;
  discordChannelName?: string;
  slackChannelName?: string;
  slackWebhookUrl?: string;
  attendees: Attendee[];
  isRecurring: boolean;
  recurrenceCadence: "none" | "daily" | "weekly" | "biweekly" | "monthly";
  recurrenceDayOfWeek?: string;
  status: "Scheduled" | "In Progress" | "Completed" | "Cancelled";
  transcript?: string;
  transcriptPdfDataUrl?: string;
  keyTakeaways: string[];
  actionItems: ActionItem[];
  recordingUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface MeetingsClientProps {
  meetings: MeetingItem[];
  projects: Array<{ _id: string; name: string }>;
  clientAccounts: Array<{
    _id: string;
    accountName: string;
    primaryContact: { name: string; email: string };
  }>;
  users: Array<{ _id: string; name: string; email: string; role: string }>;
  isGuest?: boolean;
  currentUser?: { name: string; email: string; role: string };
}

export default function MeetingsClient({
  meetings,
  projects,
  clientAccounts,
  users,
  isGuest = false,
  currentUser = { name: "Team Member", email: "", role: "member" },
}: MeetingsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"all" | "cadences" | "transcripts">("all");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [localStatusMap, setLocalStatusMap] = useState<Record<string, string>>({});
  const [localStatusTimestampMap, setLocalStatusTimestampMap] = useState<Record<string, number>>({});

  // Modals & Drawers state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"standard" | "recurring">("standard");
  const [activeRecordMeeting, setActiveRecordMeeting] = useState<MeetingItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Form State for Scheduling
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formScheduledAt, setFormScheduledAt] = useState("");
  const [formDuration, setFormDuration] = useState("45");
  const [formPlatform, setFormPlatform] = useState<
    "google_meet" | "zoom" | "slack" | "discord" | "in_person"
  >("google_meet");
  const [formMeetingLink, setFormMeetingLink] = useState("");
  const [formDiscordChannelName, setFormDiscordChannelName] = useState("");
  const [formDiscordChannelUrl, setFormDiscordChannelUrl] = useState("");
  const [formSlackChannelName, setFormSlackChannelName] = useState("");
  const [formProjectId, setFormProjectId] = useState("");
  const [formClientId, setFormClientId] = useState("");
  const [formIsRecurring, setFormIsRecurring] = useState(false);
  const [formRecurrenceCadence, setFormRecurrenceCadence] = useState<
    "daily" | "weekly" | "biweekly" | "monthly"
  >("weekly");
  const [formRecurrenceDay, setFormRecurrenceDay] = useState("Monday");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [externalAttendeeEmails, setExternalAttendeeEmails] = useState("");

  // Edit Meeting State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<MeetingItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editScheduledAt, setEditScheduledAt] = useState("");
  const [editDuration, setEditDuration] = useState("45");
  const [editPlatform, setEditPlatform] = useState<
    "google_meet" | "zoom" | "slack" | "discord" | "in_person"
  >("google_meet");
  const [editMeetingLink, setEditMeetingLink] = useState("");
  const [editDiscordChannelName, setEditDiscordChannelName] = useState("");
  const [editDiscordChannelUrl, setEditDiscordChannelUrl] = useState("");
  const [editSlackChannelName, setEditSlackChannelName] = useState("");
  const [editProjectId, setEditProjectId] = useState("");
  const [editClientId, setEditClientId] = useState("");
  const [editIsRecurring, setEditIsRecurring] = useState(false);
  const [editRecurrenceCadence, setEditRecurrenceCadence] = useState<
    "daily" | "weekly" | "biweekly" | "monthly"
  >("weekly");
  const [editRecurrenceDay, setEditRecurrenceDay] = useState("Monday");
  const [editSelectedUserIds, setEditSelectedUserIds] = useState<string[]>([]);
  const [editExternalEmails, setEditExternalEmails] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Transcript Record Drawer State
  const [drawerTranscript, setDrawerTranscript] = useState("");
  const [drawerTakeaways, setDrawerTakeaways] = useState<string[]>([]);
  const [drawerNewTakeaway, setDrawerNewTakeaway] = useState("");
  const [drawerActionItems, setDrawerActionItems] = useState<ActionItem[]>([]);
  const [drawerNewActionText, setDrawerNewActionText] = useState("");
  const [drawerNewActionAssignee, setDrawerNewActionAssignee] = useState("");

  // Stats
  const stats = useMemo(() => {
    const total = meetings.length;
    const cadences = meetings.filter((m) => m.isRecurring).length;
    const completed = meetings.filter((m) => (localStatusMap[m._id] || m.status) === "Completed").length;
    const withTranscripts = meetings.filter((m) => m.transcript && m.transcript.trim().length > 0).length;
    return { total, cadences, completed, withTranscripts };
  }, [meetings, localStatusMap]);

  // Project map for quick name resolution
  const projectMap = useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach((p) => map.set(p._id, p.name));
    return map;
  }, [projects]);

  // Filtered and Auto-Sorted meetings
  // Hierarchy:
  // 1. In Progress (if 2 or more: compare which started first)
  // 2. Scheduled (which are closer to current time to longer time to start this schedule)
  // 3. Completed (recent completed to old completed)
  // 4. Cancelled (recent to old)
  const filteredMeetings = useMemo(() => {
    const list = meetings.filter((m) => {
      // Tab filter
      if (activeTab === "cadences" && !m.isRecurring) return false;
      if (activeTab === "transcripts" && (!m.transcript || m.transcript.trim().length === 0)) return false;

      // Platform filter (normalized: legacy stored values map to canonical ids)
      if (selectedPlatform !== "all" && normalizeMeetingPlatform(m.platform) !== selectedPlatform) return false;

      // Status filter
      const effectiveStatus = localStatusMap[m._id] || m.status;
      if (selectedStatus !== "all" && effectiveStatus !== selectedStatus) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = m.title.toLowerCase().includes(q);
        const matchesDesc = (m.description || "").toLowerCase().includes(q);
        const matchesClient = (m.clientAccountName || "").toLowerCase().includes(q);
        const matchesAttendee = m.attendees.some(
          (a) => a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)
        );
        const matchesDiscord = (m.discordChannelName || "").toLowerCase().includes(q);
        const matchesSlack = (m.slackChannelName || "").toLowerCase().includes(q);
        return matchesTitle || matchesDesc || matchesClient || matchesAttendee || matchesDiscord || matchesSlack;
      }

      return true;
    });

    const now = Date.now();
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

    return list.sort((a, b) => {
      const statusA = localStatusMap[a._id] || a.status;
      const statusB = localStatusMap[b._id] || b.status;

      const priorityA = getStatusPriority(statusA);
      const priorityB = getStatusPriority(statusB);

      // 1. Primary order: Status category priority (In Progress -> Scheduled -> Completed -> Cancelled)
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      const startA = new Date(a.scheduledAt).getTime();
      const startB = new Date(b.scheduledAt).getTime();

      // 2. In Progress: compare which started first (earliest start time first)
      if (statusA === "In Progress") {
        if (startA !== startB) {
          return startA - startB;
        }
        const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return createdA - createdB;
      }

      // 3. Scheduled: always sort to less time remaining for scheduled meeting (earliest start time first)
      if (statusA === "Scheduled") {
        if (startA !== startB) {
          return startA - startB;
        }
        const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return createdA - createdB;
      }

      // 4. Completed: recent completed to old completed
      if (statusA === "Completed") {
        const compTimeA = localStatusTimestampMap[a._id]
          || (a.updatedAt ? new Date(a.updatedAt).getTime() : a.createdAt ? new Date(a.createdAt).getTime() : startA);
        const compTimeB = localStatusTimestampMap[b._id]
          || (b.updatedAt ? new Date(b.updatedAt).getTime() : b.createdAt ? new Date(b.createdAt).getTime() : startB);
        return compTimeB - compTimeA;
      }

      // 5. Cancelled: recent to old
      if (statusA === "Cancelled") {
        const cancelTimeA = localStatusTimestampMap[a._id]
          || (a.updatedAt ? new Date(a.updatedAt).getTime() : a.createdAt ? new Date(a.createdAt).getTime() : startA);
        const cancelTimeB = localStatusTimestampMap[b._id]
          || (b.updatedAt ? new Date(b.updatedAt).getTime() : b.createdAt ? new Date(b.createdAt).getTime() : startB);
        return cancelTimeB - cancelTimeA;
      }

      return 0;
    });
  }, [meetings, activeTab, selectedPlatform, selectedStatus, searchQuery, localStatusMap, localStatusTimestampMap]);

  // Reset form helper
  const openScheduleModal = (mode: "standard" | "recurring" = "standard") => {
    setModalMode(mode);
    setFormTitle("");
    setFormDescription("");
    // Default scheduled time: 2 hours from now formatted for datetime-local
    const future = new Date(Date.now() + 2 * 60 * 60 * 1000);
    future.setMinutes(Math.ceil(future.getMinutes() / 15) * 15, 0, 0);
    const localIso = new Date(future.getTime() - future.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setFormScheduledAt(localIso);
    setFormDuration("45");
    setFormPlatform("google_meet");
    setFormMeetingLink("");
    setFormDiscordChannelName("");
    setFormDiscordChannelUrl("");
    setFormSlackChannelName("");
    setFormProjectId("");
    setFormClientId("");
    setFormIsRecurring(mode === "recurring");
    setFormRecurrenceCadence("weekly");
    setFormRecurrenceDay("Monday");
    setSelectedUserIds([]);
    setExternalAttendeeEmails("");
    setIsScheduleModalOpen(true);
  };

  // Open transcript editor drawer
  const openTranscriptDrawer = (meeting: MeetingItem) => {
    setActiveRecordMeeting(meeting);
    setDrawerTranscript(meeting.transcript || "");
    setDrawerTakeaways(meeting.keyTakeaways ? [...meeting.keyTakeaways] : []);
    setDrawerNewTakeaway("");
    setDrawerActionItems(meeting.actionItems ? JSON.parse(JSON.stringify(meeting.actionItems)) : []);
    setDrawerNewActionText("");
    setDrawerNewActionAssignee("");
  };

  // Open edit modal
  const openEditModal = (meeting: MeetingItem) => {
    setEditingMeeting(meeting);
    setEditTitle(meeting.title || "");
    setEditDescription(meeting.description || "");

    try {
      const d = new Date(meeting.scheduledAt);
      const pad = (n: number) => String(n).padStart(2, "0");
      const localIso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      setEditScheduledAt(localIso);
    } catch {
      setEditScheduledAt("");
    }

    setEditDuration(String(meeting.durationMinutes || 45));
    setEditPlatform(normalizeMeetingPlatform(meeting.platform));
    setEditMeetingLink(meeting.meetingLink || "");
    setEditDiscordChannelName(meeting.discordChannelName || "");
    setEditDiscordChannelUrl(meeting.discordChannelUrl || "");
    setEditSlackChannelName(meeting.slackChannelName || "");
    setEditProjectId(meeting.projectId || "");
    setEditClientId(meeting.clientAccountId || "");
    // Pre-fill roster: match attendees back to directory users, leftovers become external emails.
    {
      const ids: string[] = [];
      const externals: string[] = [];
      const byId = new Set(users.map((u) => u._id));
      const byEmail = new Map(users.map((u) => [u.email.toLowerCase(), u._id]));
      for (const att of meeting.attendees || []) {
        if (att.userId && byId.has(att.userId)) {
          if (!ids.includes(att.userId)) ids.push(att.userId);
        } else if (att.email && byEmail.has(att.email.toLowerCase())) {
          const id = byEmail.get(att.email.toLowerCase())!;
          if (!ids.includes(id)) ids.push(id);
        } else if (att.email) {
          if (!externals.includes(att.email)) externals.push(att.email);
        }
      }
      setEditSelectedUserIds(ids);
      setEditExternalEmails(externals.join(", "));
    }
    setEditIsRecurring(Boolean(meeting.isRecurring));
    setEditRecurrenceCadence((meeting.recurrenceCadence as any) || "weekly");
    setEditRecurrenceDay(meeting.recurrenceDayOfWeek || "Monday");
    setIsEditModalOpen(true);
  };

  // Submit edit meeting
  const handleUpdateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMeeting || isGuest) return;

    setIsSubmittingEdit(true);
    try {
      const formData = new FormData();
      formData.set("meetingId", editingMeeting._id);
      formData.set("title", editTitle);
      formData.set("description", editDescription);
      formData.set("scheduledAt", editScheduledAt);
      formData.set("durationMinutes", editDuration);
      formData.set("platform", editPlatform);
      formData.set("meetingLink", editMeetingLink);
      formData.set("discordChannelName", editDiscordChannelName);
      formData.set("discordChannelUrl", editDiscordChannelUrl);
      formData.set("slackChannelName", editSlackChannelName);
      formData.set("projectId", editProjectId);
      formData.set("clientAccountId", editClientId);
      formData.set("isRecurring", String(editIsRecurring));
      formData.set("recurrenceCadence", editRecurrenceCadence);
      formData.set("recurrenceDayOfWeek", editRecurrenceDay);
      formData.set("attendeeUserIds", JSON.stringify(editSelectedUserIds));
      formData.set("externalEmails", editExternalEmails);

      await updateMeeting(formData);
      setActionFeedback("Meeting details updated successfully!");
      setIsEditModalOpen(false);
      setEditingMeeting(null);
    } catch (err: any) {
      alert(err.message || "Failed to update meeting.");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Copy link helper
  const handleCopyLink = (id: string, link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Handle PDF Generation & Download
  const handleDownloadPdf = async (meetingId: string) => {
    setDownloadingPdfId(meetingId);
    try {
      const result = await generateMeetingTranscriptPdf(meetingId);
      if (result.success && result.pdfDataUrl) {
        // Create an invisible download link
        const link = document.createElement("a");
        link.href = result.pdfDataUrl;
        link.download = `meeting-transcript-${result.title ? result.title.replace(/[^a-z0-9]/gi, "-").toLowerCase() : meetingId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setActionFeedback("PDF Transcript downloaded successfully!");
        setTimeout(() => setActionFeedback(null), 3000);
      } else {
        alert("Failed to compile transcript PDF.");
      }
    } catch (err: any) {
      alert("Error generating PDF: " + (err.message || "Unknown error"));
    } finally {
      setDownloadingPdfId(null);
    }
  };

  // Submit Schedule Form
  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) return;

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("title", formTitle);
        formData.set("description", formDescription);
        formData.set("scheduledAt", formScheduledAt);
        formData.set("durationMinutes", formDuration);
        formData.set("platform", formPlatform);
        formData.set("meetingLink", formMeetingLink);
        formData.set("discordChannelName", formDiscordChannelName);
        formData.set("discordChannelUrl", formDiscordChannelUrl);
        formData.set("slackChannelName", formSlackChannelName);
        if (formProjectId) formData.set("projectId", formProjectId);
        if (formClientId) formData.set("clientAccountId", formClientId);

        formData.set("isRecurring", formIsRecurring ? "true" : "false");
        formData.set("recurrenceCadence", formIsRecurring ? formRecurrenceCadence : "none");
        formData.set("recurrenceDayOfWeek", formRecurrenceDay);

        // Gather attendees
        const selectedUsers = users.filter((u) => selectedUserIds.includes(u._id));
        const allEmails = selectedUsers.map((u) => u.email);
        const allNames = selectedUsers.map((u) => u.name);

        if (externalAttendeeEmails.trim()) {
          const externals = externalAttendeeEmails
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          externals.forEach((ext) => {
            allEmails.push(ext);
            allNames.push(ext.split("@")[0]);
          });
        }

        // If client selected, add primary contact email
        if (formClientId) {
          const client = clientAccounts.find((c) => c._id === formClientId);
          if (client?.primaryContact?.email && !allEmails.includes(client.primaryContact.email)) {
            allEmails.push(client.primaryContact.email);
            allNames.push(client.primaryContact.name || "Client Lead");
          }
        }

        formData.set("attendeeEmails", allEmails.join(","));
        formData.set("attendeeNames", allNames.join(","));

        await createMeeting(formData);
        setIsScheduleModalOpen(false);
        setActionFeedback("Meeting scheduled and platform link synchronized!");
        setTimeout(() => setActionFeedback(null), 3000);
      } catch (err: any) {
        alert(err.message || "Failed to schedule meeting.");
      }
    });
  };

  // Save Transcript changes
  const handleSaveTranscript = async () => {
    if (!activeRecordMeeting || isGuest) return;

    startTransition(async () => {
      try {
        await updateMeetingTranscript(
          activeRecordMeeting._id,
          drawerTranscript,
          drawerTakeaways,
          drawerActionItems
        );
        setActionFeedback("Meeting records and action items updated successfully!");
        setActiveRecordMeeting(null);
        setTimeout(() => setActionFeedback(null), 3000);
      } catch (err: any) {
        alert(err.message || "Failed to update meeting transcript.");
      }
    });
  };

  // Change meeting status
  const handleStatusChange = (meetingId: string, newStatus: string) => {
    if (isGuest) return;
    const changeTimestamp = Date.now();
    setLocalStatusMap((prev) => ({ ...prev, [meetingId]: newStatus }));
    setLocalStatusTimestampMap((prev) => ({ ...prev, [meetingId]: changeTimestamp }));
    startTransition(async () => {
      try {
        await updateMeetingStatus(meetingId, newStatus);
      } catch (err: any) {
        setLocalStatusMap((prev) => {
          const next = { ...prev };
          delete next[meetingId];
          return next;
        });
        setLocalStatusTimestampMap((prev) => {
          const next = { ...prev };
          delete next[meetingId];
          return next;
        });
        alert(err.message || "Failed to update status.");
      }
    });
  };

  // Delete meeting
  const handleDeleteMeeting = async (meetingId: string) => {
    if (isGuest) return;
    if (!confirm("Are you sure you want to remove this meeting record?")) return;
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("meetingId", meetingId);
        await deleteMeeting(formData);
      } catch (err: any) {
        alert(err.message || "Failed to delete meeting.");
      }
    });
  };

  // Platform style helper
  const getPlatformBadge = (platform: MeetingItem["platform"]) => {
    switch (platform) {
      case "google_meet":
        return {
          label: "Google Meet",
          icon: Video,
          color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
          accent: "#10B981",
        };
      case "zoom":
        return {
          label: "Zoom Video",
          icon: Video,
          color: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
          accent: "#0EA5E9",
        };
      case "slack":
        return {
          label: "Slack",
          icon: MessageSquare,
          color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
          accent: "#A855F7",
        };
      case "discord":
        return {
          label: "Discord",
          icon: Mic,
          color: "bg-[#5865F2]/10 text-[#5865F2] border-[#5865F2]/20",
          accent: "#5865F2",
        };
      case "in_person":
      default:
        return {
          label: "In-Person",
          icon: Users,
          color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
          accent: "#F59E0B",
        };
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F8] dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 space-y-8">
      {/* Toast feedback */}
      {actionFeedback && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-600 text-white shadow-xl animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className="text-sm font-medium">{actionFeedback}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="p-2 rounded-lg bg-[#0078D4]/10 text-[#0078D4] dark:bg-[#0078D4]/20">
              <Video className="w-6 h-6" />
            </span>
            <h1 className="text-lg lg:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Meetings & Discussions Hub
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-3xl">
            Company auto-scheduler, cross-platform video & chat connectivity (Google Meet, Zoom, Slack, Discord voice), and meeting transcripts with downloadable PDF minutes.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => openScheduleModal("recurring")}
            disabled={isGuest}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold shadow-xs transition-colors ${isGuest
              ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-300 dark:border-gray-600"
              : "bg-white dark:bg-[#252423] text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#2C2B29] cursor-pointer"
              }`}
          >
            <Repeat className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Scheduler</span>
          </button>

          <button
            onClick={() => openScheduleModal("standard")}
            disabled={isGuest}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold shadow-xs transition-colors ${isGuest
              ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-300 dark:border-gray-600"
              : "bg-[#0078D4] hover:bg-[#106EBE] text-white cursor-pointer"
              }`}
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Meeting</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#252423] shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">
            <span>Total Scheduled</span>
            <Calendar className="w-4 h-4 text-[#0078D4]" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
          <div className="text-[11px] text-gray-500 mt-1">Cross-platform sessions</div>
        </div>

        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#252423] shadow-xs">
          <div className="flex items-center justify-between text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">
            <span>Auto-Schedulers</span>
            <Repeat className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.cadences}</div>
          <div className="text-[11px] text-gray-500 mt-1">Daily / Weekly cadences</div>
        </div>

        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#252423] shadow-xs">
          <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">
            <span>Completed Sessions</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completed}</div>
          <div className="text-[11px] text-gray-500 mt-1">Delivered syncs</div>
        </div>

        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#252423] shadow-xs">
          <div className="flex items-center justify-between text-xs text-sky-600 dark:text-sky-400 font-medium mb-1">
            <span>Transcripts & Minutes</span>
            <FileText className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.withTranscripts}</div>
          <div className="text-[11px] text-gray-500 mt-1">Stored with PDF export</div>
        </div>
      </div>

      {/* Filter and Tab Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#252423]">
        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-[#1E1E1E] rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-md transition-colors ${activeTab === "all"
              ? "bg-white dark:bg-[#2D2C2A] text-gray-900 dark:text-white shadow-xs font-semibold"
              : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
              }`}
          >
            All Meetings ({meetings.length})
          </button>
          <button
            onClick={() => setActiveTab("cadences")}
            className={`px-3 py-1.5 rounded-md transition-colors ${activeTab === "cadences"
              ? "bg-white dark:bg-[#2D2C2A] text-gray-900 dark:text-white shadow-xs font-semibold"
              : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
              }`}
          >
            Auto-Cadences ({stats.cadences})
          </button>
          <button
            onClick={() => setActiveTab("transcripts")}
            className={`px-3 py-1.5 rounded-md transition-colors ${activeTab === "transcripts"
              ? "bg-white dark:bg-[#2D2C2A] text-gray-900 dark:text-white shadow-xs font-semibold"
              : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
              }`}
          >
            Transcripts & Minutes ({stats.withTranscripts})
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search meetings, attendees, discord..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-[#FAF9F8] dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-[#0078D4]"
            />
          </div>

          {/* Platform selector */}
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1E1E1E] text-gray-800 dark:text-gray-200 outline-none cursor-pointer"
          >
            <option value="all">All Platforms</option>
            <option value="google_meet">Google Meet</option>
            <option value="zoom">Zoom Video</option>
            <option value="slack">Slack Huddles</option>
            <option value="discord">Discord Channel</option>
            <option value="in_person">In-Person</option>
          </select>

          {/* Status selector */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1E1E1E] text-gray-800 dark:text-gray-200 outline-none cursor-pointer"
          >
            <option value="all">All Statuses (Auto-Sorted)</option>
            <option value="Scheduled">Scheduled</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {/* Auto-sort hierarchy indicator badge */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/60 text-[11px] font-semibold select-none shadow-xs"
            title="Auto-Sorted: 1) In Progress (earliest started first) → 2) Scheduled (closest to current time first) → 3) Completed (recent to old) → 4) Cancelled (recent to old)"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Auto-Sorted</span>
          </div>
        </div>
      </div>

      {/* Main Meetings Listing */}
      {filteredMeetings.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-gray-300 dark:border-gray-800 rounded-xl bg-white dark:bg-[#252423]">
          <Video className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
          <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300">
            No meetings found
          </h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1 mb-5">
            {searchQuery
              ? "No discussions match your filter query. Try modifying your search criteria."
              : "No meetings have been scheduled in this section yet. Click below to schedule a meeting or configure recurring cadences."}
          </p>
          <button
            onClick={() => openScheduleModal("standard")}
            disabled={isGuest}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${isGuest
              ? "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
              : "bg-[#0078D4] hover:bg-[#106EBE] text-white cursor-pointer"
              }`}
          >
            <Plus className="w-4 h-4" />
            <span>Schedule First Meeting</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMeetings.map((meeting) => {
            const platformConfig = getPlatformBadge(normalizeMeetingPlatform(meeting.platform));
            const PlatformIcon = platformConfig.icon;
            const scheduledDate = new Date(meeting.scheduledAt);

            const effectiveStatus = localStatusMap[meeting._id] || meeting.status;

            return (
              <div
                key={meeting._id}
                className={`flex flex-col justify-between rounded-2xl border p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 space-y-4 ${
                  effectiveStatus === "Completed"
                    ? "border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 hover:border-emerald-300"
                    : effectiveStatus === "In Progress"
                      ? "border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20 hover:border-amber-300"
                      : effectiveStatus === "Cancelled"
                        ? "border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 hover:border-red-300"
                        : "border-gray-200 dark:border-gray-800 bg-blue-50/40 dark:bg-blue-950/20 hover:border-[#0078D4]/40"
                }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border shadow-sm ${platformConfig.color}`}
                    >
                      <PlatformIcon className="w-3.5 h-3.5" />
                      <span>{platformConfig.label}</span>
                    </span>

                    {/* Status & recurrence */}
                    <div className="flex items-center gap-1.5">
                      {meeting.isRecurring && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/25">
                          <Repeat className="w-3 h-3" />
                          <span>Auto ({meeting.recurrenceCadence})</span>
                        </span>
                      )}

                      <select
                        value={effectiveStatus}
                        onChange={(e) => handleStatusChange(meeting._id, e.target.value)}
                        disabled={isGuest}
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border outline-none ${effectiveStatus === "Completed"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                          : effectiveStatus === "In Progress"
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/30 animate-pulse"
                            : effectiveStatus === "Cancelled"
                              ? "bg-red-500/10 text-red-600 border-red-500/30"
                              : "bg-blue-500/10 text-blue-600 border-blue-500/30"
                          } ${isGuest ? "cursor-not-allowed opacity-80" : "cursor-pointer"}`}
                      >
                        <option value="Scheduled">Scheduled</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  {/* Meeting Title */}
                  <h3 className="font-extrabold text-[15px] text-gray-900 dark:text-white leading-snug line-clamp-1 tracking-tight">
                    {meeting.title}
                  </h3>

                  {/* Description */}
                  {meeting.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                      {meeting.description}
                    </p>
                  )}

                  {/* Linkages: Project & Client */}
                  {(meeting.projectId || meeting.clientAccountName) && (
                    <div className="flex flex-wrap items-center gap-2 mt-3 p-2 rounded-lg bg-white/70 dark:bg-black/30 border border-gray-100 dark:border-gray-800 text-[11px] shadow-sm">
                      {meeting.projectId && (
                        <span className="inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-300 font-medium">
                          <span className="w-5 h-5 rounded-md bg-[#0078D4]/10 flex items-center justify-center shrink-0">
                            <Layers className="w-3 h-3 text-[#0078D4]" />
                          </span>
                          <span>{projectMap.get(meeting.projectId) || "Project"}</span>
                        </span>
                      )}
                      {meeting.clientAccountName && (
                        <span className="inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-300 font-medium">
                          <span className="w-5 h-5 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <Briefcase className="w-3 h-3 text-emerald-600" />
                          </span>
                          <span>
                            {meeting.clientAccountName}
                          </span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Schedule Telemetry */}
                  <div className="mt-3 space-y-2 text-xs text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-gray-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                        <Calendar className="w-3 h-3 text-gray-500" />
                      </span>
                      <span className="font-medium">
                        {scheduledDate.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-gray-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                        <Clock className="w-3 h-3 text-gray-500" />
                      </span>
                      <span className="font-medium">
                        {scheduledDate.toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        • {meeting.durationMinutes} mins
                      </span>
                    </div>

                    {/* Discord or Slack Specific Connectivity Info */}
                    {meeting.discordChannelName && (
                      <div className="flex items-center gap-1.5 text-[11px] text-[#5865F2] font-semibold pt-0.5">
                        <Hash className="w-3 h-3" />
                        <span>Discord: #{meeting.discordChannelName}</span>
                      </div>
                    )}
                    {meeting.slackChannelName && (
                      <div className="flex items-center gap-1.5 text-[11px] text-purple-600 dark:text-purple-400 font-semibold pt-0.5">
                        <MessageSquare className="w-3 h-3" />
                        <span>Slack: #{meeting.slackChannelName}</span>
                      </div>
                    )}
                  </div>

                  {/* Attendees Roster */}
                  <div className="mt-4 pt-3 border-t border-dashed border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between text-[11px] text-gray-500 mb-2">
                      <span className="flex items-center gap-1 font-semibold">
                        <Users className="w-3 h-3" />
                        <span>Invitees ({meeting.attendees.length})</span>
                      </span>
                      <span>Organizer: {meeting.organizerName.split(" ")[0]}</span>
                    </div>

                    <div className="flex items-center flex-wrap">
                      <div className="flex -space-x-1.5">
                      {meeting.attendees.slice(0, 4).map((att, idx) => (
                        <div
                          key={idx}
                          title={`${att.name} (${att.email}) - ${att.attendanceStatus}`}
                          className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-200 text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#252423]"
                        >
                          {att.name.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      </div>
                      {meeting.attendees.length > 4 && (
                        <span className="text-[10px] text-gray-400 font-semibold ml-2">
                          +{meeting.attendees.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2.5">
                  {/* Platform Launch & Copy Link */}
                  <div className="flex items-center gap-2">
                    <a
                      href={meeting.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-[#0078D4] to-[#106EBE] hover:from-[#106EBE] hover:to-[#005A9E] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
                    >
                      <PlatformIcon className="w-3.5 h-3.5" />
                      <span>
                        {meeting.platform === "discord"
                          ? "Join Discord Voice"
                          : meeting.platform === "slack"
                            ? "Open Slack Huddle"
                            : meeting.platform === "zoom"
                              ? "Join Zoom Video"
                              : "Join Google Meet"}
                      </span>
                      <ExternalLink className="w-3 h-3 opacity-80" />
                    </a>

                    <button
                      onClick={() => handleCopyLink(meeting._id, meeting.meetingLink)}
                      title="Copy invite URL"
                      className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2A2928] hover:border-gray-300 transition-colors cursor-pointer"
                    >
                      {copiedId === meeting._id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Transcript & Minutes & Card actions — single Edit lives here */}
                  <div className="flex items-center justify-between gap-2 pt-0.5 text-[11px]">
                    <button
                      onClick={() => openTranscriptDrawer(meeting)}
                      className="flex items-center gap-1.5 text-[#0078D4] hover:text-[#106EBE] font-bold cursor-pointer px-1 py-0.5 rounded transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>
                        {meeting.transcript ? "View Minutes & Notes" : "+ Record Transcript"}
                      </span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(meeting)}
                        disabled={isGuest}
                        title="Edit Meeting Details"
                        className={`flex items-center gap-1 font-bold px-2 py-1 rounded-lg transition-colors ${
                          isGuest
                            ? "cursor-not-allowed opacity-50 text-gray-400"
                            : "text-[#0078D4] dark:text-[#479EF5] hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
                        }`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <span className="w-px h-3.5 bg-gray-200 dark:bg-gray-700" />

                      <button
                        onClick={() => handleDownloadPdf(meeting._id)}
                        disabled={downloadingPdfId === meeting._id}
                        title="Download Official PDF Transcript"
                        className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{downloadingPdfId === meeting._id ? "Compiling..." : "PDF"}</span>
                      </button>

                      <span className="w-px h-3.5 bg-gray-200 dark:bg-gray-700" />

                      <button
                        onClick={() => handleDeleteMeeting(meeting._id)}
                        disabled={isGuest}
                        title="Delete Meeting"
                        className={`p-1.5 rounded-lg transition-colors ${isGuest ? "cursor-not-allowed opacity-50 text-gray-400" : "text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                          }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SCHEDULE MEETING MODAL */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-[#FAF9F8] dark:bg-[#252423]">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[#0078D4]/10 text-[#0078D4]">
                  {modalMode === "recurring" ? (
                    <Repeat className="w-5 h-5 text-purple-600" />
                  ) : (
                    <Video className="w-5 h-5 text-[#0078D4]" />
                  )}
                </span>
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">
                    {modalMode === "recurring"
                      ? "Create Auto-Scheduler Cadence"
                      : "Schedule New Meeting"}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Cross-platform connectivity with Google Meet, Zoom, Slack, and Discord.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2E2D2B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateSchedule} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Meeting Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Meeting Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Weekly Architecture Sync, Cloud9 300Hz Testing Debrief"
                  className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#252423] text-xs text-gray-900 dark:text-white outline-none focus:border-[#0078D4]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Agenda & Description
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Goals, agenda items, discussion topics..."
                  className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#252423] text-xs text-gray-900 dark:text-white outline-none focus:border-[#0078D4]"
                />
              </div>

              {/* Platform Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Connectivity & Meeting Platform *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  {[
                    { id: "google_meet", label: "Google Meet", icon: Video, color: "emerald" },
                    { id: "zoom", label: "Zoom Video", icon: Video, color: "sky" },
                    { id: "slack", label: "Slack Huddle", icon: MessageSquare, color: "purple" },
                    { id: "discord", label: "Discord Voice", icon: Mic, color: "indigo" },
                  ].map((p) => {
                    const isSel = formPlatform === p.id;
                    const Icon = p.icon;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setFormPlatform(p.id as any)}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold transition-all ${isSel
                          ? "border-[#0078D4] bg-[#0078D4]/10 text-[#0078D4] shadow-xs"
                          : "border-gray-200 dark:border-gray-800 bg-white dark:bg-[#252423] text-gray-600 dark:text-gray-400 hover:border-gray-400"
                          }`}
                      >
                        <Icon className="w-5 h-5 mb-1.5" />
                        <span>{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Platform specific fields */}
              {formPlatform === "discord" && (
                <div className="p-3.5 rounded-lg border border-[#5865F2]/30 bg-[#5865F2]/5 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#5865F2]">
                    <Mic className="w-4 h-4" />
                    <span>Discord Channel & Voice Connectivity</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Discord Channel Name
                      </label>
                      <input
                        type="text"
                        value={formDiscordChannelName}
                        onChange={(e) => setFormDiscordChannelName(e.target.value)}
                        placeholder="e.g. dev-voice, gaming-ops"
                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1E1E1E] text-xs text-gray-900 dark:text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Discord Channel / Server Invite URL
                      </label>
                      <input
                        type="text"
                        value={formDiscordChannelUrl}
                        onChange={(e) => setFormDiscordChannelUrl(e.target.value)}
                        placeholder="https://discord.gg/... or https://discord.com/channels/..."
                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1E1E1E] text-xs text-gray-900 dark:text-white outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {formPlatform === "slack" && (
                <div className="p-3.5 rounded-lg border border-purple-500/30 bg-purple-500/5 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400">
                    <MessageSquare className="w-4 h-4" />
                    <span>Slack Channel & Huddle Integration</span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Slack Channel Name
                    </label>
                    <input
                      type="text"
                      value={formSlackChannelName}
                      onChange={(e) => setFormSlackChannelName(e.target.value)}
                      placeholder="e.g. general, sprint-standup"
                      className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1E1E1E] text-xs text-gray-900 dark:text-white outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Custom Direct Meeting Link with Live Generator Link & Paste */}
              <div className="space-y-2 p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-[#FAF9F8] dark:bg-[#222120]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200">
                    Direct Meeting URL (Recommended for reliable attendance)
                  </label>

                  {/* Provider Direct Scheduler Launcher Button */}
                  {(() => {
                    const launcher = platformLauncher(formPlatform);
                    if (!launcher) return null;
                    return (
                      <a
                        href={launcher.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-semibold transition-colors shrink-0 ${launcher.color}`}
                        title="Open official provider in a new tab to create and copy a real, permanent room URL"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>{launcher.label}</span>
                      </a>
                    );
                  })()}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formMeetingLink}
                    onChange={(e) => setFormMeetingLink(e.target.value)}
                    placeholder={
                      formPlatform === "google_meet"
                        ? "https://meet.google.com/xxx-yyyy-zzz"
                        : formPlatform === "zoom"
                          ? "https://zoom.us/j/94827103819"
                          : formPlatform === "slack"
                            ? "https://app.slack.com/client/T000/C000"
                            : formPlatform === "discord"
                              ? "https://discord.gg/your-channel or https://discord.com/channels/..."
                              : "Enter room or location link"
                    }
                    className="flex-1 p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1E1E1E] text-xs text-gray-900 dark:text-white outline-none focus:border-[#0078D4]"
                  />

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const clip = await navigator.clipboard.readText();
                        if (clip) setFormMeetingLink(clip.trim());
                      } catch {
                        // ignore permission denial
                      }
                    }}
                    className="px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#252423] hover:bg-gray-100 dark:hover:bg-[#2E2D2B] text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 cursor-pointer shrink-0"
                    title="Paste copied URL from your clipboard"
                  >
                    <Copy className="w-3.5 h-3.5 text-gray-400" />
                    <span>Paste</span>
                  </button>
                </div>

                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Tip: Click the button above to launch <strong>{platformDisplayName(formPlatform)}</strong>, copy your generated URL, and paste it here so the meeting link always works for invitees.
                </p>
              </div>

              {/* Date, Time & Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formScheduledAt}
                    onChange={(e) => setFormScheduledAt(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#252423] text-xs text-gray-900 dark:text-white outline-none focus:border-[#0078D4]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Duration
                  </label>
                  <select
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#252423] text-xs text-gray-900 dark:text-white outline-none focus:border-[#0078D4] cursor-pointer"
                  >
                    <option value="15">15 Minutes (Quick Sync)</option>
                    <option value="30">30 Minutes (Standard Standup)</option>
                    <option value="45">45 Minutes (Architecture Sync)</option>
                    <option value="60">60 Minutes (Deep Dive / Client Review)</option>
                    <option value="90">90 Minutes (Executive Workshop)</option>
                  </select>
                </div>
              </div>

              {/* Auto-Scheduler / Recurrence Options */}
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-[#FAF9F8] dark:bg-[#222120] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Repeat className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      Auto-Scheduler (Recurring Cadence)
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formIsRecurring}
                    onChange={(e) => setFormIsRecurring(e.target.checked)}
                    className="w-4 h-4 accent-[#0078D4] rounded cursor-pointer"
                  />
                </div>

                {formIsRecurring && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        Cadence Frequency
                      </label>
                      <select
                        value={formRecurrenceCadence}
                        onChange={(e) => setFormRecurrenceCadence(e.target.value as any)}
                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1E1E1E] text-xs text-gray-900 dark:text-white outline-none"
                      >
                        <option value="daily">Daily Standup (Mon - Fri)</option>
                        <option value="weekly">Weekly Meeting</option>
                        <option value="biweekly">Bi-Weekly Sync</option>
                        <option value="monthly">Monthly Executive Council</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        Cadence Day of Week
                      </label>
                      <select
                        value={formRecurrenceDay}
                        onChange={(e) => setFormRecurrenceDay(e.target.value)}
                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1E1E1E] text-xs text-gray-900 dark:text-white outline-none"
                      >
                        <option value="Monday">Every Monday</option>
                        <option value="Tuesday">Every Tuesday</option>
                        <option value="Wednesday">Every Wednesday</option>
                        <option value="Thursday">Every Thursday</option>
                        <option value="Friday">Every Friday</option>
                        <option value="Weekdays">Every Weekday</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Link Project & CRM Client */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Link Project (Optional)
                  </label>
                  <select
                    value={formProjectId}
                    onChange={(e) => setFormProjectId(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#252423] text-xs text-gray-900 dark:text-white outline-none cursor-pointer"
                  >
                    <option value="">None (Company General)</option>
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Link CRM Client Account (Optional)
                  </label>
                  <select
                    value={formClientId}
                    onChange={(e) => setFormClientId(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#252423] text-xs text-gray-900 dark:text-white outline-none cursor-pointer"
                  >
                    <option value="">None (Internal Team)</option>
                    {clientAccounts.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.accountName} ({c.primaryContact.name || "Client Lead"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Attendee Roster Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Select Team Member Invitees
                </label>
                <div className="max-h-36 overflow-y-auto p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#252423] space-y-1">
                  {users.map((u) => {
                    const isChecked = selectedUserIds.includes(u._id);
                    return (
                      <label
                        key={u._id}
                        className="flex items-center justify-between p-1.5 rounded hover:bg-gray-50 dark:hover:bg-[#2E2D2B] cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUserIds([...selectedUserIds, u._id]);
                              } else {
                                setSelectedUserIds(selectedUserIds.filter((id) => id !== u._id));
                              }
                            }}
                            className="rounded accent-[#0078D4]"
                          />
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            {u.name}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-400">{u.role}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* External Attendees */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  External Invitee Emails (Comma separated)
                </label>
                <input
                  type="text"
                  value={externalAttendeeEmails}
                  onChange={(e) => setExternalAttendeeEmails(e.target.value)}
                  placeholder="partner@external.com, investor@capital.com"
                  className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#252423] text-xs text-gray-900 dark:text-white outline-none"
                />
              </div>

              {/* Footer Buttons */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2E2D2B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGuest || isPending}
                  className={`px-5 py-2.5 rounded-lg text-xs font-semibold shadow-xs transition-colors ${isGuest
                    ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-300 dark:border-gray-600"
                    : "bg-[#0078D4] hover:bg-[#106EBE] text-white cursor-pointer"
                    }`}
                >
                  {isGuest
                    ? "Disabled in Guest Mode"
                    : isPending
                      ? "Saving Schedule..."
                      : modalMode === "recurring"
                        ? "Establish Auto-Scheduler"
                        : "Create & Broadcast Meeting"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MEETING MODAL */}
      {isEditModalOpen && editingMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-[#FAF9F8] dark:bg-[#252423]">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[#0078D4]/10 text-[#0078D4]">
                  <Pencil className="w-5 h-5 text-[#0078D4]" />
                </span>
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">
                    Edit Meeting Details
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Update meeting title, schedule, connectivity link, and cadences.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingMeeting(null);
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2E2D2B] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleUpdateMeeting} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Meeting Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Meeting Title *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="e.g. Weekly Architecture Sync"
                  className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#252423] text-xs text-gray-900 dark:text-white outline-none focus:border-[#0078D4]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Agenda &amp; Description
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Goals, agenda items, discussion topics..."
                  className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#252423] text-xs text-gray-900 dark:text-white outline-none focus:border-[#0078D4]"
                />
              </div>

              {/* Platform Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Connectivity &amp; Meeting Platform *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  {[
                    { id: "google_meet", label: "Google Meet", icon: Video },
                    { id: "zoom", label: "Zoom Video", icon: Video },
                    { id: "slack", label: "Slack Huddle", icon: MessageSquare },
                    { id: "discord", label: "Discord Voice", icon: Mic },
                  ].map((p) => {
                    const isSel = editPlatform === p.id;
                    const Icon = p.icon;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setEditPlatform(p.id as any)}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                          isSel
                            ? "border-[#0078D4] bg-[#0078D4]/10 text-[#0078D4] shadow-xs"
                            : "border-gray-200 dark:border-gray-800 bg-white dark:bg-[#252423] text-gray-600 dark:text-gray-400 hover:border-gray-400"
                        }`}
                      >
                        <Icon className="w-5 h-5 mb-1.5" />
                        <span>{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Meeting Link with provider launcher + Paste (same flow as Schedule) */}
              <div className="space-y-2 p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-[#FAF9F8] dark:bg-[#222120]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200">
                    Meeting URL / Platform Link
                  </label>
                  {(() => {
                    const launcher = platformLauncher(editPlatform);
                    if (!launcher) return null;
                    return (
                      <a
                        href={launcher.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-semibold transition-colors shrink-0 ${launcher.color}`}
                        title="Open official provider in a new tab to create and copy a real, permanent room URL"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>{launcher.label}</span>
                      </a>
                    );
                  })()}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editMeetingLink}
                    onChange={(e) => setEditMeetingLink(e.target.value)}
                    placeholder={
                      editPlatform === "google_meet"
                        ? "https://meet.google.com/xxx-yyyy-zzz"
                        : editPlatform === "zoom"
                          ? "https://zoom.us/j/94827103819"
                          : editPlatform === "slack"
                            ? "https://app.slack.com/client/T000/C000"
                            : editPlatform === "discord"
                              ? "https://discord.gg/your-channel or https://discord.com/channels/..."
                              : "Enter room or location link"
                    }
                    className="flex-1 p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1E1E1E] text-xs text-gray-900 dark:text-white outline-none focus:border-[#0078D4]"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const clip = await navigator.clipboard.readText();
                        if (clip) setEditMeetingLink(clip.trim());
                      } catch {
                        // ignore permission denial
                      }
                    }}
                    className="px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#252423] hover:bg-gray-100 dark:hover:bg-[#2E2D2B] text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 cursor-pointer shrink-0"
                    title="Paste copied URL from your clipboard"
                  >
                    <Copy className="w-3.5 h-3.5 text-gray-400" />
                    <span>Paste</span>
                  </button>
                </div>

                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Tip: Click the button above to launch <strong>{platformDisplayName(editPlatform)}</strong>, copy your generated URL, and paste it here so the meeting link always works for invitees.
                </p>
              </div>

              {/* Discord or Slack Specific Fields */}
              {editPlatform === "discord" && (
                <div className="p-3.5 rounded-lg border border-[#5865F2]/30 bg-[#5865F2]/5 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#5865F2]">
                    <Mic className="w-4 h-4" />
                    <span>Discord Channel &amp; Voice Settings</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Discord Channel Name
                      </label>
                      <input
                        type="text"
                        value={editDiscordChannelName}
                        onChange={(e) => setEditDiscordChannelName(e.target.value)}
                        placeholder="e.g. general-voice, esports-sync"
                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#252423] text-xs text-gray-900 dark:text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Discord Invite / Channel URL
                      </label>
                      <input
                        type="text"
                        value={editDiscordChannelUrl}
                        onChange={(e) => setEditDiscordChannelUrl(e.target.value)}
                        placeholder="https://discord.gg/..."
                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#252423] text-xs text-gray-900 dark:text-white outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {editPlatform === "slack" && (
                <div className="p-3.5 rounded-lg border border-purple-500/30 bg-purple-500/5 space-y-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Slack Channel Name
                  </label>
                  <input
                    type="text"
                    value={editSlackChannelName}
                    onChange={(e) => setEditSlackChannelName(e.target.value)}
                    placeholder="#proj-architecture-huddle"
                    className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#252423] text-xs text-gray-900 dark:text-white outline-none"
                  />
                </div>
              )}

              {/* Schedule Date & Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Date &amp; Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={editScheduledAt}
                    onChange={(e) => setEditScheduledAt(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#252423] text-xs text-gray-900 dark:text-white outline-none focus:border-[#0078D4]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Duration (Minutes) *
                  </label>
                  <select
                    value={editDuration}
                    onChange={(e) => setEditDuration(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#252423] text-xs text-gray-900 dark:text-white outline-none"
                  >
                    <option value="15">15 Minutes (Quick Sync)</option>
                    <option value="30">30 Minutes (Standard Standup)</option>
                    <option value="45">45 Minutes (Architecture Sync)</option>
                    <option value="60">60 Minutes (Deep Dive / Client Review)</option>
                    <option value="90">90 Minutes (Executive Workshop)</option>
                  </select>
                </div>
              </div>

              {/* Link Project & CRM Client */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Linked Project
                  </label>
                  <select
                    value={editProjectId}
                    onChange={(e) => setEditProjectId(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#252423] text-xs text-gray-900 dark:text-white outline-none"
                  >
                    <option value="">None (Company General)</option>
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Linked Client Account (CRM)
                  </label>
                  <select
                    value={editClientId}
                    onChange={(e) => setEditClientId(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#252423] text-xs text-gray-900 dark:text-white outline-none"
                  >
                    <option value="">None (Internal Team)</option>
                    {clientAccounts.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.accountName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Attendee Roster (pre-filled from current invitees) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Team Member Invitees
                </label>
                <div className="max-h-36 overflow-y-auto p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#252423] space-y-1">
                  {users.map((u) => {
                    const isChecked = editSelectedUserIds.includes(u._id);
                    return (
                      <label
                        key={u._id}
                        className="flex items-center justify-between p-1.5 rounded hover:bg-gray-50 dark:hover:bg-[#2E2D2B] cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditSelectedUserIds([...editSelectedUserIds, u._id]);
                              } else {
                                setEditSelectedUserIds(editSelectedUserIds.filter((id) => id !== u._id));
                              }
                            }}
                            className="rounded accent-[#0078D4]"
                          />
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            {u.name}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-400">{u.role}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* External Attendees */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  External Invitee Emails (Comma separated)
                </label>
                <input
                  type="text"
                  value={editExternalEmails}
                  onChange={(e) => setEditExternalEmails(e.target.value)}
                  placeholder="partner@external.com, investor@capital.com"
                  className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#252423] text-xs text-gray-900 dark:text-white outline-none"
                />
              </div>

              {/* Recurring Cadence Options */}
              <div className="p-3.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-[#FAF9F8] dark:bg-[#252423] space-y-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-800 dark:text-gray-200">
                  <input
                    type="checkbox"
                    checked={editIsRecurring}
                    onChange={(e) => setEditIsRecurring(e.target.checked)}
                    className="rounded accent-[#0078D4]"
                  />
                  <span>Configure as Recurring Cadence</span>
                </label>

                {editIsRecurring && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        Cadence Frequency
                      </label>
                      <select
                        value={editRecurrenceCadence}
                        onChange={(e) => setEditRecurrenceCadence(e.target.value as any)}
                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1E1E1E] text-xs text-gray-900 dark:text-white outline-none"
                      >
                        <option value="daily">Daily Standup (Mon - Fri)</option>
                        <option value="weekly">Weekly Meeting</option>
                        <option value="biweekly">Bi-Weekly Sync</option>
                        <option value="monthly">Monthly Executive Council</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        Cadence Day of Week
                      </label>
                      <select
                        value={editRecurrenceDay}
                        onChange={(e) => setEditRecurrenceDay(e.target.value)}
                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1E1E1E] text-xs text-gray-900 dark:text-white outline-none"
                      >
                        <option value="Monday">Every Monday</option>
                        <option value="Tuesday">Every Tuesday</option>
                        <option value="Wednesday">Every Wednesday</option>
                        <option value="Thursday">Every Thursday</option>
                        <option value="Friday">Every Friday</option>
                        <option value="Weekdays">Every Weekday</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Buttons */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingMeeting(null);
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2E2D2B] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGuest || isSubmittingEdit}
                  className={`px-5 py-2.5 rounded-lg text-xs font-semibold shadow-xs transition-colors ${
                    isGuest
                      ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-300 dark:border-gray-600"
                      : "bg-[#0078D4] hover:bg-[#106EBE] text-white cursor-pointer"
                  }`}
                >
                  {isSubmittingEdit ? "Saving Changes..." : "Save Meeting Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSCRIPT & MEETING MINUTES DRAWER */}
      {activeRecordMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#1E1E1E] w-full max-w-2xl h-full shadow-2xl flex flex-col border-l border-gray-200 dark:border-gray-800 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-[#FAF9F8] dark:bg-[#252423]">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                  <FileText className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">
                    Meeting Minutes & Transcript Records
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                    {activeRecordMeeting.title}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPdf(activeRecordMeeting._id)}
                  disabled={downloadingPdfId === activeRecordMeeting._id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{downloadingPdfId === activeRecordMeeting._id ? "Compiling..." : "PDF Minutes"}</span>
                </button>
                <button
                  onClick={() => setActiveRecordMeeting(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2E2D2B]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Meeting Quick Telemetry Card */}
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-[#FAF9F8] dark:bg-[#252423] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Scheduled Time</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {new Date(activeRecordMeeting.scheduledAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Platform Link</span>
                  <a
                    href={activeRecordMeeting.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#0078D4] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Launch {activeRecordMeeting.platform.toUpperCase()}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                {activeRecordMeeting.discordChannelName && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Discord Channel</span>
                    <span className="text-[#5865F2] font-semibold">
                      #{activeRecordMeeting.discordChannelName}
                    </span>
                  </div>
                )}
                {activeRecordMeeting.clientAccountName && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Client Account</span>
                    <span className="text-emerald-600 font-semibold">
                      {activeRecordMeeting.clientAccountName}
                    </span>
                  </div>
                )}
              </div>

              {/* Key Takeaways Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Executive Key Takeaways ({drawerTakeaways.length})</span>
                  </label>
                </div>

                <div className="space-y-2">
                  {drawerTakeaways.map((takeaway, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between gap-2 p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#252423] text-xs"
                    >
                      <div className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{takeaway}</span>
                      </div>
                      <button
                        onClick={() => setDrawerTakeaways(drawerTakeaways.filter((_, i) => i !== idx))}
                        className="text-gray-400 hover:text-red-500 shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* Add Takeaway Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add key takeaway point..."
                      value={drawerNewTakeaway}
                      onChange={(e) => setDrawerNewTakeaway(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && drawerNewTakeaway.trim()) {
                          e.preventDefault();
                          setDrawerTakeaways([...drawerTakeaways, drawerNewTakeaway.trim()]);
                          setDrawerNewTakeaway("");
                        }
                      }}
                      className="flex-1 p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#252423] text-xs text-gray-900 dark:text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (drawerNewTakeaway.trim()) {
                          setDrawerTakeaways([...drawerTakeaways, drawerNewTakeaway.trim()]);
                          setDrawerNewTakeaway("");
                        }
                      }}
                      className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-[#2A2928] hover:bg-gray-200 text-xs font-semibold text-gray-700 dark:text-gray-200"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Items Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Action Items & Commitments ({drawerActionItems.length})</span>
                  </label>
                </div>

                <div className="space-y-2">
                  {drawerActionItems.map((act, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#252423] text-xs"
                    >
                      <label className="flex items-center gap-2.5 flex-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={act.completed}
                          onChange={(e) => {
                            const updated = [...drawerActionItems];
                            updated[idx].completed = e.target.checked;
                            setDrawerActionItems(updated);
                          }}
                          className="rounded accent-emerald-600"
                        />
                        <span
                          className={`${act.completed
                            ? "line-through text-gray-400 dark:text-gray-500"
                            : "text-gray-800 dark:text-gray-200 font-medium"
                            }`}
                        >
                          {act.text}
                        </span>
                      </label>

                      {act.assigneeName && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold">
                          @{act.assigneeName}
                        </span>
                      )}

                      <button
                        onClick={() => setDrawerActionItems(drawerActionItems.filter((_, i) => i !== idx))}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* Add Action Item Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="New action item task..."
                      value={drawerNewActionText}
                      onChange={(e) => setDrawerNewActionText(e.target.value)}
                      className="flex-1 p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#252423] text-xs text-gray-900 dark:text-white outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Assignee (e.g. Alex)"
                      value={drawerNewActionAssignee}
                      onChange={(e) => setDrawerNewActionAssignee(e.target.value)}
                      className="w-32 p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#252423] text-xs text-gray-900 dark:text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (drawerNewActionText.trim()) {
                          setDrawerActionItems([
                            ...drawerActionItems,
                            {
                              text: drawerNewActionText.trim(),
                              assigneeName: drawerNewActionAssignee.trim() || undefined,
                              completed: false,
                            },
                          ]);
                          setDrawerNewActionText("");
                          setDrawerNewActionAssignee("");
                        }
                      }}
                      className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-[#2A2928] hover:bg-gray-200 text-xs font-semibold text-gray-700 dark:text-gray-200"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Full Discussion Transcript */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-[#0078D4]" />
                    <span>Verbatim Transcript & Discussion Log</span>
                  </span>
                  <span className="text-[10px] text-gray-400 font-normal">
                    Speech-to-text / recorded notes
                  </span>
                </label>
                <textarea
                  rows={8}
                  value={drawerTranscript}
                  onChange={(e) => setDrawerTranscript(e.target.value)}
                  placeholder="Paste or write meeting transcript, participant quotes, discussion flow..."
                  className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#252423] text-xs font-mono text-gray-800 dark:text-gray-200 outline-none leading-relaxed focus:border-[#0078D4]"
                />
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-[#FAF9F8] dark:bg-[#252423] flex items-center justify-between">
              <span className="text-[11px] text-gray-400">
                Saving updates meeting status to Completed and syncs records.
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveRecordMeeting(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2E2D2B]"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSaveTranscript}
                  disabled={isGuest || isPending}
                  className={`px-5 py-2.5 rounded-lg text-xs font-semibold shadow-xs transition-colors ${isGuest
                    ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-300 dark:border-gray-600"
                    : "bg-[#0078D4] hover:bg-[#106EBE] text-white cursor-pointer"
                    }`}
                >
                  {isGuest ? "Disabled in Guest Mode" : isPending ? "Saving Records..." : "Save Records to DB"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
