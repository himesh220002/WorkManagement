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
  X,
  Sparkles,
  Send,
  Mic,
  Play,
  Briefcase,
  Layers,
  ChevronRight,
  Info,
} from "lucide-react";
import {
  createMeeting,
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

export interface MeetingItem {
  _id: string;
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
    const completed = meetings.filter((m) => m.status === "Completed").length;
    const withTranscripts = meetings.filter((m) => m.transcript && m.transcript.trim().length > 0).length;
    return { total, cadences, completed, withTranscripts };
  }, [meetings]);

  // Project map for quick name resolution
  const projectMap = useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach((p) => map.set(p._id, p.name));
    return map;
  }, [projects]);

  // Filtered meetings
  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      // Tab filter
      if (activeTab === "cadences" && !m.isRecurring) return false;
      if (activeTab === "transcripts" && (!m.transcript || m.transcript.trim().length === 0)) return false;

      // Platform filter
      if (selectedPlatform !== "all" && m.platform !== selectedPlatform) return false;

      // Status filter
      if (selectedStatus !== "all" && m.status !== selectedStatus) return false;

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
  }, [meetings, activeTab, selectedPlatform, selectedStatus, searchQuery]);

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
  const handleStatusChange = async (meetingId: string, newStatus: string) => {
    if (isGuest) return;
    startTransition(async () => {
      try {
        await updateMeetingStatus(meetingId, newStatus);
      } catch (err: any) {
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
          label: "Slack Channel / Huddle",
          icon: MessageSquare,
          color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
          accent: "#A855F7",
        };
      case "discord":
        return {
          label: "Discord Channel",
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
    <div className="min-h-screen bg-[#FAF9F8] dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 p-4 md:p-8 space-y-8">
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
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
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
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold shadow-xs transition-colors ${
              isGuest
                ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-300 dark:border-gray-600"
                : "bg-white dark:bg-[#252423] text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#2C2B29] cursor-pointer"
            }`}
          >
            <Repeat className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>+ Auto-Scheduler Cadence</span>
          </button>

          <button
            onClick={() => openScheduleModal("standard")}
            disabled={isGuest}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold shadow-xs transition-colors ${
              isGuest
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
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === "all"
                ? "bg-white dark:bg-[#2D2C2A] text-gray-900 dark:text-white shadow-xs font-semibold"
                : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
            }`}
          >
            All Meetings ({meetings.length})
          </button>
          <button
            onClick={() => setActiveTab("cadences")}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === "cadences"
                ? "bg-white dark:bg-[#2D2C2A] text-gray-900 dark:text-white shadow-xs font-semibold"
                : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
            }`}
          >
            Auto-Cadences ({stats.cadences})
          </button>
          <button
            onClick={() => setActiveTab("transcripts")}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === "transcripts"
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
            <option value="all">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
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
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              isGuest
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
            const platformConfig = getPlatformBadge(meeting.platform);
            const PlatformIcon = platformConfig.icon;
            const scheduledDate = new Date(meeting.scheduledAt);

            return (
              <div
                key={meeting._id}
                className="flex flex-col justify-between rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#252423] p-5 shadow-xs hover:border-[#0078D4]/50 transition-all duration-200 space-y-4"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${platformConfig.color}`}
                    >
                      <PlatformIcon className="w-3.5 h-3.5" />
                      <span>{platformConfig.label}</span>
                    </span>

                    {/* Status Dropdown */}
                    <div className="flex items-center gap-1.5">
                      {meeting.isRecurring && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                          <Repeat className="w-3 h-3" />
                          <span>Auto ({meeting.recurrenceCadence})</span>
                        </span>
                      )}

                      <select
                        value={meeting.status}
                        onChange={(e) => handleStatusChange(meeting._id, e.target.value)}
                        disabled={isGuest || isPending}
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border outline-none ${
                          meeting.status === "Completed"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                            : meeting.status === "In Progress"
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/30 animate-pulse"
                            : meeting.status === "Cancelled"
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
                  <h3 className="font-bold text-base text-gray-900 dark:text-white leading-snug line-clamp-1">
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
                    <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-gray-100 dark:border-gray-800 text-[11px]">
                      {meeting.projectId && (
                        <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                          <Layers className="w-3 h-3 text-[#0078D4]" />
                          <span>{projectMap.get(meeting.projectId) || "Project"}</span>
                        </span>
                      )}
                      {meeting.clientAccountName && (
                        <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                          <Briefcase className="w-3 h-3 text-emerald-600" />
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {meeting.clientAccountName}
                          </span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Schedule Telemetry */}
                  <div className="mt-3 space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>
                        {scheduledDate.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>
                        {scheduledDate.toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        • {meeting.durationMinutes} mins
                      </span>
                    </div>

                    {/* Discord or Slack Specific Connectivity Info */}
                    {meeting.discordChannelName && (
                      <div className="flex items-center gap-1.5 text-[11px] text-[#5865F2] font-medium pt-1">
                        <Hash className="w-3 h-3" />
                        <span>Discord: #{meeting.discordChannelName}</span>
                      </div>
                    )}
                    {meeting.slackChannelName && (
                      <div className="flex items-center gap-1.5 text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                        <MessageSquare className="w-3 h-3" />
                        <span>Slack: #{meeting.slackChannelName}</span>
                      </div>
                    )}
                  </div>

                  {/* Attendees Roster */}
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between text-[11px] text-gray-500 mb-2">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>Invitees ({meeting.attendees.length})</span>
                      </span>
                      <span>Organizer: {meeting.organizerName.split(" ")[0]}</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {meeting.attendees.slice(0, 4).map((att, idx) => (
                        <div
                          key={idx}
                          title={`${att.name} (${att.email}) - ${att.attendanceStatus}`}
                          className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-[10px] font-bold flex items-center justify-center border border-white dark:border-gray-800"
                        >
                          {att.name.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {meeting.attendees.length > 4 && (
                        <span className="text-[10px] text-gray-400 font-medium">
                          +{meeting.attendees.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
                  {/* Platform Launch & Copy Link */}
                  <div className="flex items-center gap-2">
                    <a
                      href={meeting.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#0078D4] hover:bg-[#106EBE] text-white text-xs font-semibold shadow-xs transition-colors"
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
                      className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2A2928] cursor-pointer"
                    >
                      {copiedId === meeting._id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Transcript & PDF Minutes actions */}
                  <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
                    <button
                      onClick={() => openTranscriptDrawer(meeting)}
                      className="flex items-center gap-1 text-[#0078D4] hover:underline font-semibold cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>
                        {meeting.transcript ? "View Minutes & Notes" : "+ Record Transcript"}
                      </span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownloadPdf(meeting._id)}
                        disabled={downloadingPdfId === meeting._id}
                        title="Download Official PDF Transcript"
                        className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer disabled:opacity-50"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{downloadingPdfId === meeting._id ? "Compiling..." : "PDF"}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteMeeting(meeting._id)}
                        disabled={isGuest}
                        title="Delete Meeting"
                        className={`p-1 text-gray-400 hover:text-red-500 transition-colors ${
                          isGuest ? "cursor-not-allowed opacity-50" : "cursor-pointer"
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
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold transition-all ${
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
                    const launcher =
                      formPlatform === "google_meet"
                        ? {
                            url: "https://meet.google.com/new",
                            label: "Create Google Meet Room ↗",
                            color: "bg-emerald-600 hover:bg-emerald-700 text-white",
                          }
                        : formPlatform === "zoom"
                        ? {
                            url: "https://zoom.us/meeting/schedule",
                            label: "Schedule on Zoom ↗",
                            color: "bg-sky-600 hover:bg-sky-700 text-white",
                          }
                        : formPlatform === "slack"
                        ? {
                            url: "https://app.slack.com/",
                            label: "Open Slack App ↗",
                            color: "bg-purple-600 hover:bg-purple-700 text-white",
                          }
                        : formPlatform === "discord"
                        ? {
                            url: "https://discord.com/app",
                            label: "Open Discord & Copy Channel Link ↗",
                            color: "bg-[#5865F2] hover:bg-[#4752C4] text-white",
                          }
                        : null;

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
                  Tip: Click the button above to launch <strong>{formPlatform === "google_meet" ? "Google Meet" : formPlatform === "zoom" ? "Zoom" : formPlatform === "slack" ? "Slack" : "Discord"}</strong>, copy your generated URL, and paste it here so the meeting link always works for invitees.
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
                  className={`px-5 py-2.5 rounded-lg text-xs font-semibold shadow-xs transition-colors ${
                    isGuest
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
                          className={`${
                            act.completed
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
                  className={`px-5 py-2.5 rounded-lg text-xs font-semibold shadow-xs transition-colors ${
                    isGuest
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
