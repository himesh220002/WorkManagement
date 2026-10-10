"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  MessageSquare,
  Users,
  Building2,
  Send,
  AtSign,
  Smile,
  Paperclip,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  UserCheck,
  Hash,
  Globe2,
  Layers,
  Sparkles,
  ChevronDown,
  Info,
  Clock,
  Pin,
  X,
  UserPlus,
  MessageCircle,
  Check,
  CheckSquare,
  Square,
  Pencil,
  FileText,
  ExternalLink,
  AlertCircle,
  Loader2,
  Sliders,
  CornerDownLeft,
} from "lucide-react";
import { compressImageFile } from "@/utils/imageCompressor";

interface ChatMember {
  _id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  initials: string;
}

export interface ChannelMemberItem {
  userId: string;
  name: string;
  email: string;
  role?: string;
  department?: string;
  avatar?: string;
}

export interface ChannelItem {
  _id?: string;
  channelId: string;
  name: string;
  type: "team" | "group" | "direct";
  description?: string;
  createdBy?: string;
  creatorName?: string;
  memberIds?: string[];
  memberEmails?: string[];
  members?: ChannelMemberItem[];
  isUserMember?: boolean;
  isDefault?: boolean;
}

interface SavedPersonItem {
  _id?: string;
  personUserId: string;
  personName: string;
  personEmail: string;
  personRole: string;
  personDepartment?: string;
  personAvatar?: string;
  mentionCount?: number;
}

interface ChatMessageItem {
  _id: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
  senderAvatar?: string;
  content: string;
  scope: "global" | "team" | "group" | "direct";
  targetScopeId: string;
  targetScopeName: string;
  mentionedUsers?: { userId: string; name: string }[];
  reactions?: { emoji: string; userId: string; userName: string }[];
  attachments?: {
    name: string;
    url: string;
    size?: number;
    originalSize?: number;
    type?: "image" | "pdf" | string;
    mimeType?: string;
    s3Key?: string;
    isHdOriginal?: boolean;
    reductionPercent?: number;
    expiresAt?: string | Date;
  }[];
  isEdited?: boolean;
  createdAt: string | Date;
}

interface ChatSpaceClientProps {
  currentUserName: string;
  currentUserEmail: string;
  currentUserRole: string;
  currentUserId: string;
  companyCode?: string;
}

const COMMON_EMOJIS = ["👍", "❤️", "🚀", "🎉", "👀", "🔥", "💯"];

const COMPOSER_EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  {
    label: "Smileys & People",
    emojis: ["😀", "😁", "😂", "🤣", "😊", "😍", "😎", "🤔", "😅", "😉", "🙂", "🤝"],
  },
  {
    label: "Gestures",
    emojis: ["👍", "👎", "👏", "🙌", "🙏", "💪", "👀", "✌️", "🤞", "👋", "🫡", "👌"],
  },
  {
    label: "Work & Wins",
    emojis: ["🚀", "🎉", "🔥", "💯", "✅", "📌", "📝", "📊", "💡", "🎯", "⭐", "🏆", "🐛", "🔧", "☕", "❤️"],
  },
];

const PREDEFINED_CHANNELS = [
  { id: "global", name: "Global All-Hands", scope: "global" as const, icon: Globe2, description: "Company-wide broadcasts & announcements" },
  { id: "Engineering", name: "Engineering", scope: "team" as const, icon: Layers, description: "Architecture, sprints, and code reviews" },
  { id: "Product & Design", name: "Product & Design", scope: "team" as const, icon: Sparkles, description: "Product roadmap, UX/UI, wireframes" },
  { id: "Sales & Marketing", name: "Sales & Marketing", scope: "team" as const, icon: Building2, description: "Client leads, pipeline revenue" },
  { id: "Leadership", name: "Executive Leadership", scope: "team" as const, icon: Users, description: "Strategic initiatives & OKR status" },
  { id: "frontend-squad", name: "frontend-squad", scope: "group" as const, icon: Hash, description: "Whiteboard canvas & Next.js frontend" },
  { id: "mobile-app-v2", name: "mobile-app-v2", scope: "group" as const, icon: Hash, description: "React Native & push telemetry" },
  { id: "q4-release", name: "q4-release", scope: "group" as const, icon: Hash, description: "Q4 enterprise hardening war room" },
];

export default function ChatSpaceClient({
  currentUserName,
  currentUserEmail,
  currentUserRole,
  currentUserId,
  companyCode,
}: ChatSpaceClientProps) {
  // Navigation & Scope
  const [activeChannelId, setActiveChannelId] = useState<string>("global");
  const [activeScope, setActiveScope] = useState<"global" | "team" | "group" | "direct">("global");
  const [activeScopeName, setActiveScopeName] = useState<string>("Global All-Hands");

  // Dynamic Channels State
  const [teams, setTeams] = useState<ChannelItem[]>([]);
  const [groups, setGroups] = useState<ChannelItem[]>([]);
  const [directs, setDirects] = useState<ChannelItem[]>([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState<boolean>(true);

  // Modals & Popovers
  const [showCreateTeamModal, setShowCreateTeamModal] = useState<boolean>(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState<boolean>(false);
  const [showDirectMemberModal, setShowDirectMemberModal] = useState<boolean>(false);
  const [showChannelMembersPopover, setShowChannelMembersPopover] = useState<boolean>(false);

  // Form State: Create Team
  const [newTeamName, setNewTeamName] = useState<string>("");
  const [newTeamDesc, setNewTeamDesc] = useState<string>("");
  const [selectedTeamMemberIds, setSelectedTeamMemberIds] = useState<string[]>([]);
  const [teamMemberSearchQuery, setTeamMemberSearchQuery] = useState<string>("");
  const [isCreatingTeam, setIsCreatingTeam] = useState<boolean>(false);

  // Form State: Create Group
  const [newGroupName, setNewGroupName] = useState<string>("");
  const [newGroupDesc, setNewGroupDesc] = useState<string>("");
  const [selectedGroupMemberIds, setSelectedGroupMemberIds] = useState<string[]>([]);
  const [groupMemberSearchQuery, setGroupMemberSearchQuery] = useState<string>("");
  const [isCreatingGroup, setIsCreatingGroup] = useState<boolean>(false);

  // Form State: Direct Chat Picker
  const [directMemberSearchQuery, setDirectMemberSearchQuery] = useState<string>("");
  const [isCreatingDirect, setIsCreatingDirect] = useState<boolean>(false);

  // Chat Data
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Input & Mentions State
  const [inputText, setInputText] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStartIndex, setMentionStartIndex] = useState<number>(-1);
  const [mentionSuggestions, setMentionSuggestions] = useState<ChatMember[]>([]);
  const [selectedMentionIdx, setSelectedMentionIdx] = useState<number>(0);
  const [showMentionMenu, setShowMentionMenu] = useState<boolean>(false);

  // Saved Persons
  const [savedPersons, setSavedPersons] = useState<SavedPersonItem[]>([]);
  const [allMembers, setAllMembers] = useState<ChatMember[]>([]);
  const [showAddPersonModal, setShowAddPersonModal] = useState<boolean>(false);
  const [selectedRecipientFilter, setSelectedRecipientFilter] = useState<string | null>(null);

  // Selected Scope for new message composer
  const [composerScope, setComposerScope] = useState<"global" | "team" | "group" | "direct">("global");
  const [composerTargetName, setComposerTargetName] = useState<string>("Global All-Hands");

  // Track mentioned users in the currently composing message
  const [stagedMentions, setStagedMentions] = useState<{ userId: string; name: string }[]>([]);

  // Emoji picker helper
  const [activeEmojiMessageId, setActiveEmojiMessageId] = useState<string | null>(null);

  // Composer emoji palette popover
  const [showComposerEmoji, setShowComposerEmoji] = useState<boolean>(false);

  // Inline edit / delete own messages
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editMessageText, setEditMessageText] = useState<string>("");
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  // File Attachments State (Images & PDFs with 1-day S3 auto-deletion & size reducer)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stagedAttachments, setStagedAttachments] = useState<
    Array<{
      name: string;
      url: string;
      s3Key: string;
      size: number;
      originalSize?: number;
      type: "image" | "pdf";
      mimeType: string;
      isHdOriginal?: boolean;
      reductionPercent?: number;
      expiresAt: string;
      rawFile?: File;
    }>
  >([]);
  // Default: Apply file size reducer (sendOriginalHd = false)
  const [sendOriginalHd, setSendOriginalHd] = useState<boolean>(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState<boolean>(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 1. Load Members for @mention autocomplete
  useEffect(() => {
    async function loadMembers() {
      try {
        const res = await fetch("/api/chat/members");
        const data = await res.json();
        if (data.success && data.members) {
          setAllMembers(data.members);
        }
      } catch (err) {
        console.error("Failed to load members:", err);
      }
    }
    loadMembers();
  }, []);

  // 1b. Load Channels (Teams, Groups, Direct Chats)
  const fetchChannels = async () => {
    try {
      setIsLoadingChannels(true);
      const res = await fetch("/api/chat/channels");
      const data = await res.json();
      if (data.success) {
        setTeams(data.teams || []);
        setGroups(data.groups || []);
        setDirects(data.directs || []);
      }
    } catch (err) {
      console.error("Failed to fetch chat channels:", err);
    } finally {
      setIsLoadingChannels(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  // 2. Load Saved Persons
  const fetchSavedPersons = async () => {
    try {
      const res = await fetch("/api/chat/saved-persons");
      const data = await res.json();
      if (data.success && data.savedPersons) {
        setSavedPersons(data.savedPersons);
      }
    } catch (err) {
      console.error("Failed to fetch saved persons:", err);
    }
  };

  useEffect(() => {
    fetchSavedPersons();
  }, []);

  // 3. Load Messages when channel / scope changes
  const fetchMessages = async () => {
    try {
      setIsLoadingMessages(true);
      const res = await fetch(`/api/chat/messages?scope=${activeScope}&targetScopeId=${activeChannelId}`);
      const data = await res.json();
      if (data.success && data.messages) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [activeChannelId, activeScope]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Derived display channels
  const displayTeams = useMemo(() => {
    if (teams.length > 0) return teams;
    return PREDEFINED_CHANNELS.filter((c) => c.scope === "team").map((c) => ({
      channelId: c.id,
      name: c.name,
      type: "team" as const,
      description: c.description,
      members: allMembers.slice(0, 4).map((m) => ({
        userId: m._id,
        name: m.name,
        email: m.email,
        role: m.role,
        department: m.department,
        avatar: m.initials,
      })),
    }));
  }, [teams, allMembers]);

  const displayGroups = useMemo(() => {
    if (groups.length > 0) return groups;
    return PREDEFINED_CHANNELS.filter((c) => c.scope === "group").map((c) => ({
      channelId: c.id,
      name: c.name,
      type: "group" as const,
      description: c.description,
      members: allMembers.slice(0, 3).map((m) => ({
        userId: m._id,
        name: m.name,
        email: m.email,
        role: m.role,
        department: m.department,
        avatar: m.initials,
      })),
    }));
  }, [groups, allMembers]);

  // Current Active Channel & Members
  const currentActiveChannel = useMemo(() => {
    if (activeScope === "team") {
      return displayTeams.find((t) => t.channelId === activeChannelId || t.name === activeChannelId);
    }
    if (activeScope === "group") {
      return displayGroups.find((g) => g.channelId === activeChannelId || g.name === activeChannelId);
    }
    if (activeScope === "direct") {
      return directs.find((d) => d.channelId === activeChannelId || d.name === activeChannelId);
    }
    return null;
  }, [activeScope, activeChannelId, displayTeams, displayGroups, directs]);

  const activeChannelMembers = useMemo(() => {
    if (currentActiveChannel && currentActiveChannel.members && currentActiveChannel.members.length > 0) {
      return currentActiveChannel.members;
    }
    if (activeScope === "global") {
      return allMembers.map((m) => ({
        userId: m._id,
        name: m.name,
        email: m.email,
        role: m.role,
        department: m.department,
        avatar: m.initials,
      }));
    }
    return [];
  }, [currentActiveChannel, activeScope, allMembers]);

  // Channel Selection Handlers
  const handleSelectChannel = (ch: typeof PREDEFINED_CHANNELS[0]) => {
    setActiveChannelId(ch.id);
    setActiveScope(ch.scope);
    setActiveScopeName(ch.name);
    setComposerScope(ch.scope);
    setComposerTargetName(ch.name);
    setSelectedRecipientFilter(null);
    setShowChannelMembersPopover(false);
  };

  const handleSelectTeam = (t: ChannelItem) => {
    setActiveChannelId(t.channelId || t.name);
    setActiveScope("team");
    setActiveScopeName(t.name);
    setComposerScope("team");
    setComposerTargetName(t.name);
    setSelectedRecipientFilter(null);
    setShowChannelMembersPopover(false);
  };

  const handleSelectGroup = (g: ChannelItem) => {
    setActiveChannelId(g.channelId || g.name);
    setActiveScope("group");
    setActiveScopeName(g.name);
    setComposerScope("group");
    setComposerTargetName(g.name);
    setSelectedRecipientFilter(null);
    setShowChannelMembersPopover(false);
  };

  const handleSelectDirect = (d: ChannelItem) => {
    setActiveChannelId(d.channelId);
    setActiveScope("direct");
    setActiveScopeName(d.name);
    setComposerScope("direct");
    setComposerTargetName(d.name);
    setSelectedRecipientFilter(null);
    setShowChannelMembersPopover(false);
  };

  // Toggle selection for Team modal
  const toggleTeamMemberSelection = (id: string) => {
    setSelectedTeamMemberIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  };

  // Toggle selection for Group modal
  const toggleGroupMemberSelection = (id: string) => {
    setSelectedGroupMemberIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  };

  // Member filters for modal selection
  const filteredTeamMembers = useMemo(() => {
    if (!teamMemberSearchQuery) return allMembers;
    const q = teamMemberSearchQuery.toLowerCase();
    return allMembers.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q) ||
        m.department.toLowerCase().includes(q)
    );
  }, [allMembers, teamMemberSearchQuery]);

  const filteredGroupMembers = useMemo(() => {
    if (!groupMemberSearchQuery) return allMembers;
    const q = groupMemberSearchQuery.toLowerCase();
    return allMembers.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q) ||
        m.department.toLowerCase().includes(q)
    );
  }, [allMembers, groupMemberSearchQuery]);

  const filteredDirectMembers = useMemo(() => {
    const others = allMembers.filter((m) => m._id !== currentUserId && m.email !== currentUserEmail);
    if (!directMemberSearchQuery) return others;
    const q = directMemberSearchQuery.toLowerCase();
    return others.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q) ||
        m.department.toLowerCase().includes(q)
    );
  }, [allMembers, currentUserId, currentUserEmail, directMemberSearchQuery]);

  // Create Team Action
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setIsCreatingTeam(true);
    try {
      const selectedMembersData = allMembers
        .filter((m) => selectedTeamMemberIds.includes(m._id))
        .map((m) => ({
          userId: m._id,
          name: m.name,
          email: m.email,
          role: m.role,
          department: m.department,
          avatar: m.initials,
        }));

      const res = await fetch("/api/chat/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "team",
          name: newTeamName.trim(),
          description: newTeamDesc.trim(),
          memberIds: selectedTeamMemberIds,
          members: selectedMembersData,
        }),
      });
      const data = await res.json();
      if (data.success && data.channel) {
        setTeams((prev) => [...prev, data.channel]);
        handleSelectTeam(data.channel);
        setShowCreateTeamModal(false);
        setNewTeamName("");
        setNewTeamDesc("");
        setSelectedTeamMemberIds([]);
      }
    } catch (err) {
      console.error("Failed to create team:", err);
    } finally {
      setIsCreatingTeam(false);
    }
  };

  // Create Group Action
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setIsCreatingGroup(true);
    try {
      const cleanName = newGroupName.trim().replace(/^#+/, "");
      const selectedMembersData = allMembers
        .filter((m) => selectedGroupMemberIds.includes(m._id))
        .map((m) => ({
          userId: m._id,
          name: m.name,
          email: m.email,
          role: m.role,
          department: m.department,
          avatar: m.initials,
        }));

      const res = await fetch("/api/chat/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "group",
          name: cleanName,
          description: newGroupDesc.trim(),
          memberIds: selectedGroupMemberIds,
          members: selectedMembersData,
        }),
      });
      const data = await res.json();
      if (data.success && data.channel) {
        setGroups((prev) => [...prev, data.channel]);
        handleSelectGroup(data.channel);
        setShowCreateGroupModal(false);
        setNewGroupName("");
        setNewGroupDesc("");
        setSelectedGroupMemberIds([]);
      }
    } catch (err) {
      console.error("Failed to create group:", err);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  // Start Direct 1:1 Chat
  const handleStartDirectChat = async (targetMember: ChatMember) => {
    setIsCreatingDirect(true);
    try {
      const res = await fetch("/api/chat/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "direct",
          name: targetMember.name,
          description: `Direct chat with ${targetMember.name}`,
          memberIds: [targetMember._id],
          members: [
            {
              userId: targetMember._id,
              name: targetMember.name,
              email: targetMember.email,
              role: targetMember.role,
              department: targetMember.department,
              avatar: targetMember.initials,
            },
          ],
        }),
      });
      const data = await res.json();
      if (data.success && data.channel) {
        setDirects((prev) => {
          const exists = prev.some((d) => d.channelId === data.channel.channelId);
          return exists ? prev : [...prev, data.channel];
        });
        handleSelectDirect(data.channel);
        setShowDirectMemberModal(false);
      }
    } catch (err) {
      console.error("Failed to start direct chat:", err);
    } finally {
      setIsCreatingDirect(false);
    }
  };

  // Handle Input Changes & Inline @mention detection
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const cursorPos = e.target.selectionStart;
    setInputText(val);

    // Look backwards from cursor to see if inside an @mention
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : " ";
      // Only trigger if @ is at start of line or preceded by space
      if (charBeforeAt === " " || charBeforeAt === "\n" || lastAtIndex === 0) {
        const queryText = textBeforeCursor.slice(lastAtIndex + 1);
        // If there's no space in the mention query yet
        if (!queryText.includes(" ")) {
          setMentionQuery(queryText.toLowerCase());
          setMentionStartIndex(lastAtIndex);
          setShowMentionMenu(true);
          setSelectedMentionIdx(0);

          // Filter suggestions
          const filtered = allMembers.filter(
            (m) =>
              m.name.toLowerCase().includes(queryText.toLowerCase()) ||
              m.email.toLowerCase().includes(queryText.toLowerCase()) ||
              m.role.toLowerCase().includes(queryText.toLowerCase())
          );
          setMentionSuggestions(filtered);
          return;
        }
      }
    }

    setShowMentionMenu(false);
    setMentionQuery(null);
  };

  // Keyboard navigation inside @mention dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentionMenu && mentionSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedMentionIdx((prev) => (prev + 1) % mentionSuggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedMentionIdx((prev) => (prev - 1 + mentionSuggestions.length) % mentionSuggestions.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(mentionSuggestions[selectedMentionIdx]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowMentionMenu(false);
        return;
      }
    }

    // Enter without shift sends message
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Insert selected @mention into textarea
  const insertMention = (member: ChatMember) => {
    if (mentionStartIndex === -1) return;

    const before = inputText.slice(0, mentionStartIndex);
    const cursorPos = textareaRef.current?.selectionStart || inputText.length;
    const after = inputText.slice(cursorPos);

    // Format as @FirstName LastName
    const mentionTag = `@${member.name} `;
    const updated = `${before}${mentionTag}${after}`;

    setInputText(updated);
    setShowMentionMenu(false);
    setMentionQuery(null);

    // Add to staged mentions
    setStagedMentions((prev) => {
      if (prev.some((p) => p.userId === member._id)) return prev;
      return [...prev, { userId: member._id, name: member.name }];
    });

    // Auto-save this person to Saved Persons bar if not already present
    autoSavePerson(member);

    // Focus back on textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const nextPos = before.length + mentionTag.length;
        textareaRef.current.setSelectionRange(nextPos, nextPos);
      }
    }, 50);
  };

  // Auto-save a mentioned user into Saved Persons
  const autoSavePerson = async (member: ChatMember) => {
    try {
      const res = await fetch("/api/chat/saved-persons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personUserId: member._id,
          personName: member.name,
          personEmail: member.email,
          personRole: member.role,
          personDepartment: member.department,
          action: "add",
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchSavedPersons();
      }
    } catch (err) {
      console.warn("Could not auto-save member:", err);
    }
  };

  // Remove saved person
  const handleRemoveSavedPerson = async (personUserId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch("/api/chat/saved-persons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personUserId, personName: "dummy", action: "remove" }),
      });
      setSavedPersons((prev) => prev.filter((p) => p.personUserId !== personUserId));
    } catch (err) {
      console.error("Failed to remove saved person:", err);
    }
  };

  // Click on a saved person chip to quickly mention them or toggle recipient delivery
  const handlePickSavedPerson = (p: SavedPersonItem) => {
    // If currently writing, append @mention
    const mentionTag = `@${p.personName} `;
    setInputText((prev) => (prev ? `${prev} ${mentionTag}` : mentionTag));

    setStagedMentions((prev) => {
      if (prev.some((m) => m.userId === p.personUserId)) return prev;
      return [...prev, { userId: p.personUserId, name: p.personName }];
    });

    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // File Selection & Upload (Images & PDFs to S3 with Size Reducer by default)
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be selected again if needed
    e.target.value = "";
    setAttachmentError(null);

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const isImage = file.type.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext);
    const isPdf = file.type === "application/pdf" || ext === "pdf";

    if (!isImage && !isPdf) {
      setAttachmentError("Only image files (.png, .jpg, .webp, .gif, .svg) and PDF documents (.pdf) are allowed.");
      setTimeout(() => setAttachmentError(null), 5000);
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setAttachmentError("File size exceeds 25 MB limit.");
      setTimeout(() => setAttachmentError(null), 5000);
      return;
    }

    try {
      setIsUploadingAttachment(true);

      let uploadFile: File = file;
      let isHdOriginal = sendOriginalHd;
      let reductionPercent = 0;
      let originalSize = file.size;

      // By default: apply file size reducer on images unless user ticked sendOriginalHd
      if (isImage && !sendOriginalHd) {
        try {
          const compression = await compressImageFile(file, 0.70, 1600);
          if (compression.applied) {
            uploadFile = compression.file;
            reductionPercent = compression.reductionPercent;
            originalSize = compression.originalSize;
            isHdOriginal = false;
          }
        } catch (compErr) {
          console.warn("Could not compress image, proceeding with original:", compErr);
        }
      } else if (isImage && sendOriginalHd) {
        isHdOriginal = true;
      }

      const formData = new FormData();
      formData.set("file", uploadFile);
      formData.set("channelId", activeChannelId);
      formData.set("isHdOriginal", String(isHdOriginal));
      formData.set("originalSize", String(originalSize));
      formData.set("reductionPercent", String(reductionPercent));

      const res = await fetch("/api/chat/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.attachment) {
        setStagedAttachments((prev) => [
          ...prev,
          {
            ...data.attachment,
            rawFile: file,
          },
        ]);
      } else {
        setAttachmentError(data.error || "Failed to upload file to S3");
        setTimeout(() => setAttachmentError(null), 5000);
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setAttachmentError(err.message || "Network error while uploading file");
      setTimeout(() => setAttachmentError(null), 5000);
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  // Toggle HD quality for a specific staged image
  const handleToggleStagedHd = async (index: number) => {
    const item = stagedAttachments[index];
    if (!item || !item.rawFile || item.type !== "image") return;

    try {
      setIsUploadingAttachment(true);
      const newIsHd = !item.isHdOriginal;
      let uploadFile: File = item.rawFile;
      let reductionPercent = 0;
      let originalSize = item.rawFile.size;

      if (!newIsHd) {
        const compression = await compressImageFile(item.rawFile, 0.70, 1600);
        if (compression.applied) {
          uploadFile = compression.file;
          reductionPercent = compression.reductionPercent;
          originalSize = compression.originalSize;
        }
      }

      // Cleanup prior S3 upload
      if (item.s3Key) {
        fetch("/api/chat/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ s3Key: item.s3Key }),
        }).catch(() => { });
      }

      const formData = new FormData();
      formData.set("file", uploadFile);
      formData.set("channelId", activeChannelId);
      formData.set("isHdOriginal", String(newIsHd));
      formData.set("originalSize", String(originalSize));
      formData.set("reductionPercent", String(reductionPercent));

      const res = await fetch("/api/chat/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.attachment) {
        setStagedAttachments((prev) =>
          prev.map((att, i) =>
            i === index ? { ...data.attachment, rawFile: item.rawFile } : att
          )
        );
      }
    } catch (err: any) {
      console.error("Failed to toggle HD:", err);
      setAttachmentError(err.message || "Failed to switch quality mode");
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const handleRemoveStagedAttachment = async (index: number) => {
    const target = stagedAttachments[index];
    if (!target) return;

    setStagedAttachments((prev) => prev.filter((_, i) => i !== index));

    // Cleanup S3 immediately if user unstages before sending
    if (target.s3Key) {
      try {
        await fetch("/api/chat/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ s3Key: target.s3Key }),
        });
      } catch (err) {
        console.warn("Could not delete unstaged attachment from S3:", err);
      }
    }
  };

  // Send Message
  const handleSendMessage = async () => {
    if ((!inputText.trim() && stagedAttachments.length === 0) || isSending || isUploadingAttachment) return;

    try {
      setIsSending(true);

      // Extract all @mentions from message content
      const regex = /@([A-Za-z0-9\s]+?)(?=\s@|\s|$)/g;
      const extractedNames: string[] = [];
      let match;
      while ((match = regex.exec(inputText)) !== null) {
        extractedNames.push(match[1].trim());
      }

      const allMentioned: { userId: string; name: string }[] = [...stagedMentions];
      for (const name of extractedNames) {
        const found = allMembers.find((m) => m.name.toLowerCase() === name.toLowerCase());
        if (found && !allMentioned.some((m) => m.userId === found._id)) {
          allMentioned.push({ userId: found._id, name: found.name });
        }
      }

      const payload = {
        content: inputText.trim() || (stagedAttachments.length > 0 ? (stagedAttachments[0].type === "pdf" ? `Shared PDF document: ${stagedAttachments[0].name}` : `Shared image: ${stagedAttachments[0].name}`) : ""),
        scope: composerScope,
        targetScopeId: activeChannelId,
        targetScopeName: composerTargetName,
        mentionedUsers: allMentioned,
        attachments: stagedAttachments,
      };

      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) => [...prev, data.message]);
        setInputText("");
        setStagedMentions([]);
        setStagedAttachments([]);
        setShowComposerEmoji(false);
        fetchSavedPersons(); // Refresh saved persons in case new ones were auto-pinned
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSending(false);
    }
  };

  // Toggle emoji reaction
  const handleToggleReaction = async (messageId: string, emoji: string) => {
    try {
      const res = await fetch("/api/chat/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, emoji }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) =>
          prev.map((m) => (m._id === messageId ? { ...m, reactions: data.reactions } : m))
        );
        setActiveEmojiMessageId(null);
      }
    } catch (err) {
      console.error("Failed to react to message:", err);
    }
  };

  // Insert emoji at the composer cursor position
  const insertEmojiAtCursor = (emoji: string) => {
    const ta = textareaRef.current;
    if (!ta) {
      setInputText((prev) => prev + emoji);
      return;
    }
    const start = ta.selectionStart ?? inputText.length;
    const end = ta.selectionEnd ?? inputText.length;
    setInputText(inputText.slice(0, start) + emoji + inputText.slice(end));
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + emoji.length;
      try {
        ta.setSelectionRange(pos, pos);
      } catch {
        // ignore
      }
    });
  };

  // Begin inline editing of own message
  const handleStartEdit = (msg: ChatMessageItem) => {
    setEditingMessageId(msg._id);
    setEditMessageText(msg.content);
    setActiveEmojiMessageId(null);
  };

  // Save edited message content
  const handleSaveEdit = async (messageId: string) => {
    if (!editMessageText.trim() || isSavingEdit) return;
    try {
      setIsSavingEdit(true);
      const res = await fetch("/api/chat/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, content: editMessageText }),
      });
      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === messageId
              ? { ...m, content: data.message.content, isEdited: true }
              : m
          )
        );
        setEditingMessageId(null);
        setEditMessageText("");
      }
    } catch (err) {
      console.error("Failed to edit message:", err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete own message
  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm("Delete this message? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/chat/messages?messageId=${encodeURIComponent(messageId)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => prev.filter((m) => m._id !== messageId));
        if (editingMessageId === messageId) {
          setEditingMessageId(null);
          setEditMessageText("");
        }
      }
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

  // Filter messages by search or recipient
  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesContent = m.content.toLowerCase().includes(q);
        const matchesSender = m.senderName.toLowerCase().includes(q);
        const matchesMention = m.mentionedUsers?.some((u) => u.name.toLowerCase().includes(q));
        if (!matchesContent && !matchesSender && !matchesMention) return false;
      }
      if (selectedRecipientFilter) {
        const matchesMention = m.mentionedUsers?.some((u) => u.userId === selectedRecipientFilter);
        const matchesSender = m.senderId === selectedRecipientFilter;
        if (!matchesMention && !matchesSender) return false;
      }
      return true;
    });
  }, [messages, searchQuery, selectedRecipientFilter]);

  // Format timestamp nicely
  const formatTime = (dateVal: string | Date) => {
    try {
      const d = new Date(dateVal);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "Just now";
    }
  };

  return (
    <div className="flex h-[calc(95vh-64px)] overflow-hidden bg-[#FAF9F8] dark:bg-[#121316] text-[#242424] dark:text-[#E1DFDD]">
      {/* 1. LEFT SIDEBAR: Channels & Message Scopes */}
      <aside className="w-72 shrink-0 border-r border-[#E1DFDD] dark:border-[#26282E] bg-white dark:bg-[#18191E] flex flex-col justify-between">
        <div className="p-3.5 border-b border-[#E1DFDD] dark:border-[#26282E]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                  Chat Space
                </h2>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {companyCode ? `${companyCode} Workspace` : "Corporate Hub"}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative mt-2">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search chat or @mentions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-md text-xs bg-[#F3F2F1] dark:bg-[#202228] border border-transparent focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none transition-all placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Channel Navigation Groups */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {/* Global Broadcast */}
          <div>
            <div className="px-2 py-1 text-[10px] font-bold tracking-wider uppercase text-gray-400">
              Global Level in Company
            </div>
            {PREDEFINED_CHANNELS.filter((c) => c.scope === "global").map((ch) => {
              const Icon = ch.icon;
              const isActive = activeChannelId === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => handleSelectChannel(ch)}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-xs font-medium text-left transition-colors ${isActive
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold"
                    : "hover:bg-gray-100 dark:hover:bg-[#22242B] text-gray-700 dark:text-gray-300"
                    }`}
                >
                  <Icon className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="truncate flex-1">{ch.name}</span>
                  <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full font-bold">
                    All
                  </span>
                </button>
              );
            })}
          </div>

          {/* Team Message Option */}
          <div>
            <div className="px-2 py-1 text-[10px] font-bold tracking-wider uppercase text-gray-400 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span>Team Message Option</span>
                <span className="text-[9px] text-gray-400">Departments</span>
              </div>
              <button
                onClick={() => {
                  setSelectedTeamMemberIds(allMembers.map((m) => m._id));
                  setShowCreateTeamModal(true);
                }}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-[#282B33] text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                title="Create Team (Select Members)"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {displayTeams.map((ch) => {
              const isActive = activeChannelId === (ch.channelId || ch.name);
              const memberCount = ch.members?.length || 0;
              return (
                <button
                  key={ch.channelId || ch.name}
                  onClick={() => handleSelectTeam(ch)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-left transition-colors group ${isActive
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold"
                    : "hover:bg-gray-100 dark:hover:bg-[#22242B] text-gray-700 dark:text-gray-300"
                    }`}
                  title={`${ch.name} (${memberCount} members) - ${ch.description || "Department team"}`}
                >
                  <Layers className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  <span className="truncate flex-1">{ch.name}</span>
                  {memberCount > 0 && (
                    <span className="text-[10px] bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 px-1.5 py-0.2 rounded-full font-semibold shrink-0">
                      {memberCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Group Message Option */}
          <div>
            <div className="px-2 py-1 text-[10px] font-bold tracking-wider uppercase text-gray-400 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span>Group Message Option</span>
                <span className="text-[9px] text-gray-400">Squads</span>
              </div>
              <button
                onClick={() => {
                  setSelectedGroupMemberIds([]);
                  setShowCreateGroupModal(true);
                }}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-[#282B33] text-gray-500 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
                title="Create Group (Select Members)"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {displayGroups.map((ch) => {
              const isActive = activeChannelId === (ch.channelId || ch.name);
              const memberCount = ch.members?.length || 0;
              return (
                <button
                  key={ch.channelId || ch.name}
                  onClick={() => handleSelectGroup(ch)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-left transition-colors group ${isActive
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold"
                    : "hover:bg-gray-100 dark:hover:bg-[#22242B] text-gray-700 dark:text-gray-300"
                    }`}
                  title={`#${ch.name} (${memberCount} members) - ${ch.description || "Squad group"}`}
                >
                  <Hash className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate flex-1">#{ch.name.replace(/^#+/, "")}</span>
                  {memberCount > 0 && (
                    <span className="text-[10px] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 px-1.5 py-0.2 rounded-full font-semibold shrink-0">
                      {memberCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Direct Messages (1:1) */}
          <div>
            <div className="px-2 py-1 text-[10px] font-bold tracking-wider uppercase text-gray-400 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span>Direct Messages</span>
                <span className="text-[9px] text-gray-400">1-to-1</span>
              </div>
              <button
                onClick={() => setShowDirectMemberModal(true)}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-[#282B33] text-gray-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                title="Add Direct Member for 1-to-1 Chat"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {directs.length === 0 ? (
              <button
                onClick={() => setShowDirectMemberModal(true)}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 italic text-left"
              >
                <Plus className="w-3 h-3 text-gray-400" />
                <span>Add member for 1:1 chat</span>
              </button>
            ) : (
              directs.map((ch) => {
                const isActive = activeChannelId === ch.channelId;
                const otherMember = ch.members?.find((m) => m.userId !== currentUserId) || ch.members?.[0];
                return (
                  <button
                    key={ch.channelId}
                    onClick={() => handleSelectDirect(ch)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-left transition-colors ${isActive
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold"
                      : "hover:bg-gray-100 dark:hover:bg-[#22242B] text-gray-700 dark:text-gray-300"
                      }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center">
                        {otherMember?.avatar || ch.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 border border-white dark:border-[#1E2026]" />
                    </div>
                    <span className="truncate flex-1">{otherMember?.name || ch.name}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* User Card at bottom of Left Sidebar */}
        <div className="p-3 border-t border-[#E1DFDD] dark:border-[#26282E] bg-gray-50/50 dark:bg-[#15161B] flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
            {currentUserName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
              {currentUserName}
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
              {currentUserRole}
            </p>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CHAT CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#FAF9F8] dark:bg-[#121316]">
        {/* Chat Header */}
        <div className="h-14 px-5 border-b border-[#E1DFDD] dark:border-[#26282E] bg-white dark:bg-[#18191E] flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-gray-900 dark:text-white">
                {activeScope === "group" ? `#${activeScopeName.replace(/^#/, "")}` : activeScopeName}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 dark:bg-[#252830] text-gray-600 dark:text-gray-300 capitalize">
                {activeScope} Level
              </span>
            </div>

            {/* View Channel Members Popover Button */}
            <div className="relative">
              <button
                onClick={() => setShowChannelMembersPopover(!showChannelMembersPopover)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 hover:bg-gray-200 dark:bg-[#252830] dark:hover:bg-[#2D303B] rounded-md transition-colors"
                title="View members assigned to this scope"
              >
                <Users className="w-3.5 h-3.5 text-blue-500" />
                <span>{activeChannelMembers.length} Members</span>
                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${showChannelMembersPopover ? "rotate-180" : ""}`} />
              </button>

              {/* Members Popover */}
              {showChannelMembersPopover && (
                <div className="absolute left-0 mt-2 w-80 bg-white dark:bg-[#1E2026] border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-3 z-40 animate-in fade-in-50 zoom-in-95">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 dark:border-gray-800">
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">
                        {activeScope === "team" ? "Team Members" : activeScope === "group" ? "Squad Members" : activeScope === "direct" ? "Chat Participants" : "Company Members"}
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">
                        {activeScopeName} • {activeChannelMembers.length} assigned
                      </p>
                    </div>
                    <button
                      onClick={() => setShowChannelMembersPopover(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                    {activeChannelMembers.length === 0 ? (
                      <p className="text-xs text-gray-400 italic p-2 text-center">No members listed</p>
                    ) : (
                      activeChannelMembers.map((m) => (
                        <div
                          key={m.userId || m.email}
                          className="flex items-center justify-between p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-[#252830] transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                              {m.avatar || m.name?.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                                {m.name}
                                {m.userId === currentUserId && (
                                  <span className="ml-1 text-[9px] text-blue-500 font-normal">(You)</span>
                                )}
                              </p>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                {m.role || m.department || "Member"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => {
                                insertMention({
                                  _id: m.userId,
                                  name: m.name,
                                  email: m.email,
                                  role: m.role || "Member",
                                  department: m.department || "General",
                                  initials: m.avatar || m.name.slice(0, 2).toUpperCase(),
                                });
                                setShowChannelMembersPopover(false);
                              }}
                              className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline px-1.5 py-0.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30"
                              title="Mention in chat"
                            >
                              @Mention
                            </button>
                            {m.userId !== currentUserId && (
                              <button
                                onClick={() => {
                                  setShowChannelMembersPopover(false);
                                  handleStartDirectChat({
                                    _id: m.userId,
                                    name: m.name,
                                    email: m.email,
                                    role: m.role || "Member",
                                    department: m.department || "General",
                                    initials: m.avatar || m.name.slice(0, 2).toUpperCase(),
                                  });
                                }}
                                className="text-[10px] font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-1 py-0.5"
                                title="Start 1:1 chat"
                              >
                                💬
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {selectedRecipientFilter && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium">
                <span>Filtered by Saved Person</span>
                <button
                  onClick={() => setSelectedRecipientFilter(null)}
                  className="hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddPersonModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>+ Pin to Saved Persons</span>
            </button>
          </div>
        </div>

        {/* 3. SAVED PERSONS SECTION (Prompt requirement: "and those will be saved into saved persons section for easy picking to whom this message will deliver") */}
        <div className="px-5 py-2.5 bg-[#F3F2F1] dark:bg-[#1B1D23] border-b border-[#E1DFDD] dark:border-[#26282E] flex items-center gap-3 overflow-x-auto">
          <div className="flex items-center gap-1 text-[11px] font-bold text-gray-600 dark:text-gray-300 shrink-0">
            <Pin className="w-3.5 h-3.5 text-blue-500" />
            <span>Saved Persons:</span>
          </div>

          <div className="flex items-center gap-2 flex-nowrap min-w-0">
            {savedPersons.length === 0 ? (
              <span className="text-[11px] text-gray-400 italic">
                Mention teammates with @ to auto-save them here for 1-click delivery picking.
              </span>
            ) : (
              savedPersons.map((p) => {
                const isSelected = selectedRecipientFilter === p.personUserId;
                return (
                  <div
                    key={p.personUserId}
                    onClick={() => handlePickSavedPerson(p)}
                    className={`group relative flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-all border ${isSelected
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white dark:bg-[#23252C] hover:bg-blue-50 dark:hover:bg-[#2B2E37] text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:border-blue-400"
                      }`}
                    title={`Click to pick @${p.personName} for delivery`}
                  >
                    <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-300 text-[9px] font-bold flex items-center justify-center">
                      {p.personAvatar || p.personName.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="font-semibold">{p.personName}</span>
                    {p.personRole && (
                      <span className="text-[10px] opacity-70 hidden sm:inline">
                        • {p.personRole.split(" ")[0]}
                      </span>
                    )}
                    {/* Hover remove button */}
                    <button
                      onClick={(e) => handleRemoveSavedPerson(p.personUserId, e)}
                      className="opacity-0 group-hover:opacity-100 hover:text-red-500 p-0.5 rounded transition-opacity"
                      title="Remove from saved"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}

            <button
              onClick={() => setShowAddPersonModal(true)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 hover:text-blue-600 hover:border-blue-500 transition-colors shrink-0"
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* 4. MESSAGES STREAM */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {isLoadingMessages ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-xs">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent mr-2" />
              Loading conversations...
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-500 flex items-center justify-center mb-3">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                No messages in this scope yet
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
                Type with <span className="font-semibold text-blue-500">@</span> to mention colleagues. Mentioned persons are automatically saved to your top quick-picker!
              </p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isMe = msg.senderId === currentUserId;
              return (
                <div
                  key={msg._id}
                  className="group relative flex items-start gap-3 p-2 rounded-lg hover:bg-white/60 dark:hover:bg-[#1A1C22] transition-colors"
                >
                  {/* Sender Avatar */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                    {msg.senderAvatar ||
                      msg.senderName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-xs text-gray-900 dark:text-white">
                        {msg.senderName}
                      </span>
                      {msg.senderRole && (
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 px-1.5 py-0.2 rounded bg-gray-100 dark:bg-[#252830]">
                          {msg.senderRole}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400">
                        {formatTime(msg.createdAt)}
                      </span>
                      {msg.isEdited && (
                        <span className="text-[10px] text-gray-400 italic">
                          (edited)
                        </span>
                      )}

                      {/* Own-message actions: edit / delete */}
                      {isMe && editingMessageId !== msg._id && (
                        <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleStartEdit(msg)}
                            title="Edit message"
                            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteMessage(msg._id)}
                            title="Delete message"
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </span>
                      )}

                      {/* Scope Badge */}
                      <span className="ml-auto text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded text-gray-400 bg-gray-100 dark:bg-[#23252B]">
                        {msg.scope}
                      </span>
                    </div>

                    {/* Inline editor for own message */}
                    {editingMessageId === msg._id ? (
                      <div className="mt-1 rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-[#1C1E24] p-2">
                        <textarea
                          rows={2}
                          autoFocus
                          value={editMessageText}
                          onChange={(e) => setEditMessageText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSaveEdit(msg._id);
                            } else if (e.key === "Escape") {
                              setEditingMessageId(null);
                              setEditMessageText("");
                            }
                          }}
                          className="w-full bg-transparent text-xs text-gray-900 dark:text-white focus:outline-none resize-none"
                        />
                        <div className="flex items-center justify-end gap-1.5 mt-1">
                          <button
                            onClick={() => {
                              setEditingMessageId(null);
                              setEditMessageText("");
                            }}
                            className="px-2 py-1 text-[11px] font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(msg._id)}
                            disabled={!editMessageText.trim() || isSavingEdit}
                            className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-md text-[11px] font-semibold cursor-pointer"
                          >
                            <CornerDownLeft className="w-3 h-3" />
                            <span>{isSavingEdit ? "Saving..." : "Save"}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Content with highlighted @mentions */
                      <div className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed break-words">
                        {msg.content.split(/(@[A-Za-z0-9\s]+?)(?=\s@|\s|$)/).map((segment, i) => {
                          if (segment.startsWith("@")) {
                            return (
                              <span
                                key={i}
                                className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold cursor-pointer hover:bg-blue-200 transition-colors mx-0.5"
                              >
                                <AtSign className="w-3 h-3 mr-0.5" />
                                {segment.slice(1)}
                              </span>
                            );
                          }
                          return <span key={i}>{segment}</span>;
                        })}
                      </div>
                    )}

                    {/* Rendered File Attachments (Images & PDFs with 1-Day Auto-Deletion Banner) */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {msg.attachments.map((att, attIdx) => {
                          const isExpired = att.expiresAt && new Date(att.expiresAt) <= new Date();
                          if (isExpired) return null;

                          const isPdf = att.type === "pdf" || att.name.toLowerCase().endsWith(".pdf");

                          return (
                            <div
                              key={attIdx}
                              className="rounded-lg border border-gray-200 dark:border-gray-800 bg-[#FBFBFA] dark:bg-[#1C1E24] p-2.5 max-w-md shadow-xs overflow-hidden"
                            >
                              {/* 1-Day Auto-Deletion & Quality Status Banner */}
                              <div className="flex items-center justify-between text-[10px] text-amber-600 dark:text-amber-400 font-medium mb-2 pb-1.5 border-b border-gray-100 dark:border-gray-800/80">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                                  <span>Auto-deleting in 1 day (Chat & S3)</span>
                                </span>
                                <div className="flex items-center gap-1.5">
                                  {!isPdf && (
                                    att.isHdOriginal ? (
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                        💎 HD ORIGINAL
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                        ⚡ REDUCED {att.reductionPercent ? `-${att.reductionPercent}%` : ""}
                                      </span>
                                    )
                                  )}
                                  <span className="text-gray-400 font-normal">
                                    {att.size
                                      ? att.size >= 1024 * 1024
                                        ? `${(att.size / (1024 * 1024)).toFixed(1)} MB`
                                        : `${Math.round(att.size / 1024)} KB`
                                      : "S3 Storage"}
                                  </span>
                                </div>
                              </div>

                              {isPdf ? (
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                                      <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate" title={att.name}>
                                        {att.name}
                                      </p>
                                      <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                        Adobe Acrobat PDF Document
                                      </p>
                                    </div>
                                  </div>

                                  <a
                                    href={att.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
                                  >
                                    <span>View PDF</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              ) : (
                                <div>
                                  <div className="relative group/img overflow-hidden rounded-md border border-gray-200 dark:border-gray-700 bg-black/5 dark:bg-black/30 mb-1.5">
                                    <img
                                      src={att.url}
                                      alt={att.name}
                                      className="max-h-64 w-full object-contain cursor-pointer hover:opacity-95 transition-opacity"
                                      onClick={() => window.open(att.url, "_blank")}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between text-[11px] text-gray-600 dark:text-gray-400">
                                    <span className="truncate max-w-[200px]" title={att.name}>{att.name}</span>
                                    <a
                                      href={att.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                                    >
                                      <span>Full size</span>
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Message Reactions */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {msg.reactions &&
                        msg.reactions.reduce((acc: { emoji: string; count: number; users: string[] }[], r) => {
                          const existing = acc.find((item) => item.emoji === r.emoji);
                          if (existing) {
                            existing.count += 1;
                            existing.users.push(r.userName);
                          } else {
                            acc.push({ emoji: r.emoji, count: 1, users: [r.userName] });
                          }
                          return acc;
                        }, []).map((rx, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleToggleReaction(msg._id, rx.emoji)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-gray-100 dark:bg-[#252830] hover:bg-gray-200 dark:hover:bg-[#2F333E] border border-gray-200 dark:border-gray-700 transition-colors"
                            title={`Reacted by: ${rx.users.join(", ")}`}
                          >
                            <span>{rx.emoji}</span>
                            <span className="font-bold text-gray-600 dark:text-gray-300">
                              {rx.count}
                            </span>
                          </button>
                        ))}

                      {/* Add Reaction Button */}
                      <div className="relative">
                        <button
                          onClick={() =>
                            setActiveEmojiMessageId(
                              activeEmojiMessageId === msg._id ? null : msg._id
                            )
                          }
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded transition-opacity"
                          title="Add reaction"
                        >
                          <Smile className="w-3.5 h-3.5" />
                        </button>

                        {/* Floating Quick Emoji Swatch */}
                        {activeEmojiMessageId === msg._id && (
                          <div className="absolute left-0 bottom-full mb-1 z-30 bg-white dark:bg-[#202228] border border-gray-200 dark:border-gray-700 shadow-xl rounded-lg p-1.5 flex items-center gap-1">
                            {COMMON_EMOJIS.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => handleToggleReaction(msg._id, emoji)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-[#2C2F38] rounded text-sm transition-transform hover:scale-125"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 5. MESSAGE COMPOSER WITH AUTO-SUGGESTING @MENTIONS */}
        <div className="p-4 bg-white dark:bg-[#18191E] border-t border-[#E1DFDD] dark:border-[#26282E] relative">
          {/* Floating Mention Auto-suggest Menu */}
          {showMentionMenu && mentionSuggestions.length > 0 && (
            <div className="absolute bottom-full left-4 mb-2 w-80 max-h-56 bg-white dark:bg-[#202228] border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl overflow-y-auto z-40 animate-in fade-in-50 slide-in-from-bottom-2">
              <div className="p-2 border-b border-gray-100 dark:border-gray-800 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                <span>Matching Persons ({mentionSuggestions.length})</span>
                <span className="text-blue-500 font-normal">Click or Enter to select</span>
              </div>
              {mentionSuggestions.map((member, idx) => (
                <div
                  key={member._id}
                  onClick={() => insertMention(member)}
                  className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors ${idx === selectedMentionIdx
                    ? "bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300"
                    : "hover:bg-gray-50 dark:hover:bg-[#262832] text-gray-800 dark:text-gray-200"
                    }`}
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {member.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate">{member.name}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                      {member.role} • {member.department}
                    </p>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">
                    @{member.name.split(" ")[0]}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Delivery Scope Selector & Staged Mentions */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-gray-500">Deliver To:</span>
              <div className="flex items-center gap-1">
                {(["global", "team", "group", "direct"] as const).map((sc) => (
                  <button
                    key={sc}
                    onClick={() => {
                      setComposerScope(sc);
                      if (sc === "global") setComposerTargetName("Global All-Hands");
                      else if (sc === "team") setComposerTargetName(activeScopeName);
                      else if (sc === "group") setComposerTargetName(activeScopeName);
                      else setComposerTargetName("Direct Recipients");
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold capitalize transition-all ${composerScope === sc
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-gray-100 dark:bg-[#24262E] text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                      }`}
                  >
                    {sc === "global" ? "🌐 Global" : sc === "team" ? "👥 Team" : sc === "group" ? "💬 Group" : "👤 Direct"}
                  </button>
                ))}
              </div>
            </div>

            {stagedMentions.length > 0 && (
              <div className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                <AtSign className="w-3 h-3" />
                <span>Mentions: {stagedMentions.map((m) => m.name).join(", ")}</span>
              </div>
            )}
          </div>

          {/* Composer Input Area */}
          <div className="relative border border-gray-200 dark:border-gray-700 rounded-lg bg-[#FAF9F8] dark:bg-[#1C1E24] focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
            {/* Hidden File Input for Images and PDFs */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Error Notification Banner */}
            {attachmentError && (
              <div className="px-3 py-1.5 bg-red-50 dark:bg-red-950/40 border-b border-red-200 dark:border-red-900/50 flex items-center justify-between text-xs text-red-600 dark:text-red-300">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{attachmentError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachmentError(null)}
                  className="p-0.5 hover:text-red-800 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Staged Attachments Preview Tray with HD / Size Reducer controls */}
            {stagedAttachments.length > 0 && (
              <div className="p-2 border-b border-gray-200 dark:border-gray-800 flex flex-wrap gap-2 bg-white/70 dark:bg-[#181A20]">
                {stagedAttachments.map((att, idx) => {
                  const isPdf = att.type === "pdf";
                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 p-2 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/40 text-xs shadow-xs"
                    >
                      {isPdf ? (
                        <div className="w-8 h-8 rounded bg-red-100 dark:bg-red-950/70 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center overflow-hidden shrink-0 mt-0.5">
                          <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                        </div>
                      )}

                      <div className="min-w-0 max-w-[210px]">
                        <p className="font-semibold text-gray-900 dark:text-white truncate text-[11px]" title={att.name}>
                          {att.name}
                        </p>

                        {/* Size Reduction / HD status badge */}
                        {!isPdf && (
                          <div className="flex items-center gap-1 my-0.5">
                            {att.isHdOriginal ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-300/60">
                                💎 Original HD ({att.size >= 1024 * 1024 ? `${(att.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(att.size / 1024)} KB`})
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60">
                                ⚡ Reduced {att.reductionPercent ? `-${att.reductionPercent}%` : ""} ({att.size >= 1024 * 1024 ? `${(att.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(att.size / 1024)} KB`})
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1 text-[9px] text-amber-600 dark:text-amber-400 font-medium">
                            <Clock className="w-2.5 h-2.5 shrink-0" />
                            <span>1-day expire</span>
                          </div>

                          {/* Quick Tick box: Send original HD */}
                          {!isPdf && att.rawFile && (
                            <label className="flex items-center gap-1 text-[9px] font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:text-blue-600 transition-colors">
                              <input
                                type="checkbox"
                                checked={att.isHdOriginal || false}
                                onChange={() => handleToggleStagedHd(idx)}
                                disabled={isUploadingAttachment}
                                className="w-3 h-3 rounded border-gray-300 text-blue-600 cursor-pointer"
                              />
                              <span>Send original HD</span>
                            </label>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveStagedAttachment(idx)}
                        className="p-1 rounded text-gray-400 hover:text-red-500 transition-colors cursor-pointer shrink-0"
                        title="Remove attachment"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <textarea
              ref={textareaRef}
              rows={2}
              placeholder={`Message ${activeScopeName}... Type @ to mention, or attach Images/PDFs`}
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="w-full p-3 bg-transparent text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none resize-none"
            />

            {/* Bottom Actions toolbar inside textarea */}
            <div className="px-3 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setInputText((prev) => prev + "@");
                    textareaRef.current?.focus();
                  }}
                  className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                  title="Mention person (@)"
                >
                  <AtSign className="w-4 h-4" />
                </button>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowComposerEmoji((v) => !v)}
                    className={`p-1 transition-colors rounded cursor-pointer ${showComposerEmoji ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40" : "text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"}`}
                    title="Insert emoji"
                  >
                    <Smile className="w-4 h-4" />
                  </button>

                  {/* Multi-emoji palette: click inserts into message text */}
                  {showComposerEmoji && (
                    <>
                      <div
                        className="fixed inset-0 z-30 cursor-default"
                        onClick={() => setShowComposerEmoji(false)}
                      />
                      <div className="absolute left-0 bottom-full mb-2 z-40 w-72 max-h-64 overflow-y-auto bg-white dark:bg-[#202228] border border-gray-200 dark:border-gray-700 shadow-2xl rounded-xl p-2 animate-in fade-in-50 slide-in-from-bottom-2">
                        <div className="px-1.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          Click to add to message
                        </div>
                        {COMPOSER_EMOJI_GROUPS.map((group) => (
                          <div key={group.label} className="mb-1.5">
                            <div className="px-1.5 py-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                              {group.label}
                            </div>
                            <div className="grid grid-cols-8 gap-0.5">
                              {group.emojis.map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => insertEmojiAtCursor(emoji)}
                                  className="p-1.5 text-base leading-none hover:bg-gray-100 dark:hover:bg-[#2C2F38] rounded-lg transition-transform hover:scale-125 cursor-pointer"
                                  title={emoji}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Attach File Button (Images & PDFs) */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAttachment}
                  className={`p-1 transition-colors rounded cursor-pointer ${isUploadingAttachment
                      ? "text-blue-500 animate-pulse"
                      : stagedAttachments.length > 0
                        ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40"
                        : "text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                    }`}
                  title="Attach Image or PDF (Stores in S3, self-deletes in 1 day)"
                >
                  {isUploadingAttachment ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Paperclip className="w-4 h-4" />
                  )}
                </button>

                {/* Send Original HD Checkbox Toggle (Default: Size Reducer Applied) */}
                {/* <label
                  className="flex items-center gap-1.5 text-[11px] font-medium text-gray-600 dark:text-gray-300 cursor-pointer select-none px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-[#252830] transition-colors border border-gray-200/80 dark:border-gray-800"
                  title="File size reducer is applied by default to save storage. Check this tick box to send original uncompressed HD files."
                >
                  <input
                    type="checkbox"
                    checked={sendOriginalHd}
                    onChange={(e) => setSendOriginalHd(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="flex items-center gap-1">
                    <span>Send original HD</span>
                    {sendOriginalHd ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300/60">
                        HD ON
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60">
                        Size Reducer ON (Default)
                      </span>
                    )}
                  </span>
                </label> */}
              </div>

              <button
                type="button"
                onClick={handleSendMessage}
                disabled={(!inputText.trim() && stagedAttachments.length === 0) || isSending || isUploadingAttachment}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-md text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 6. MODAL: Pin Teammate to Saved Persons */}
      {showAddPersonModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E2026] rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Pin to Saved Persons
                </h3>
              </div>
              <button
                onClick={() => setShowAddPersonModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 max-h-80 overflow-y-auto space-y-2">
              <p className="text-xs text-gray-500 mb-3">
                Saved persons appear in your top quick-picker bar for instant 1-click message delivery and mentions:
              </p>
              {allMembers.map((m) => {
                const isAlreadySaved = savedPersons.some((p) => p.personUserId === m._id);
                return (
                  <div
                    key={m._id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#262832] border border-gray-100 dark:border-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                        {m.initials}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">
                          {m.name}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                          {m.role} • {m.department}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        if (isAlreadySaved) {
                          await handleRemoveSavedPerson(m._id, { stopPropagation: () => { } } as any);
                        } else {
                          await autoSavePerson(m);
                        }
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${isAlreadySaved
                        ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                    >
                      {isAlreadySaved ? "Pinned ✓" : "Pin"}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#18191E] flex justify-end">
              <button
                onClick={() => setShowAddPersonModal(false)}
                className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create Team */}
      {showCreateTeamModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E2026] rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Create New Team</h3>
                  <p className="text-[11px] text-gray-500">Assemble department or project team and assign its members</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateTeamModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="p-4 flex-1 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Team Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g. Core Infrastructure, Growth Ops, Mobile Engineering"
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#15161B] border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Description / Department
                </label>
                <input
                  type="text"
                  value={newTeamDesc}
                  onChange={(e) => setNewTeamDesc(e.target.value)}
                  placeholder="e.g. Sprints, technical architecture, and system reliability"
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#15161B] border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Select Members ({selectedTeamMemberIds.length} selected)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTeamMemberIds(allMembers.map((m) => m._id))}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    <button
                      type="button"
                      onClick={() => setSelectedTeamMemberIds([])}
                      className="text-[11px] text-gray-500 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    value={teamMemberSearchQuery}
                    onChange={(e) => setTeamMemberSearchQuery(e.target.value)}
                    placeholder="Search members by name or role..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-[#15161B] border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-gray-50/50 dark:bg-[#15161B]/50">
                  {filteredTeamMembers.map((m) => {
                    const isSelected = selectedTeamMemberIds.includes(m._id);
                    return (
                      <div
                        key={m._id}
                        onClick={() => toggleTeamMemberSelection(m._id)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${isSelected
                          ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/60"
                          : "hover:bg-gray-100 dark:hover:bg-[#252830] border border-transparent"
                          }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            {m.initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                              {m.name}
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                              {m.role} • {m.department}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 text-blue-600">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowCreateTeamModal(false)}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTeamName.trim() || isCreatingTeam}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isCreatingTeam ? "Creating..." : "Create Team"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Create Group */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E2026] rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Hash className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Create Squad / Group</h3>
                  <p className="text-[11px] text-gray-500">Focused group channel for projects, features, or war rooms</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateGroupModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="p-4 flex-1 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Group / Squad Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-gray-400">#</span>
                  <input
                    type="text"
                    required
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                    placeholder="e.g. security-audit, design-system, payments-v2"
                    className="w-full pl-7 pr-3 py-2 text-xs bg-gray-50 dark:bg-[#15161B] border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Purpose / Topic
                </label>
                <input
                  type="text"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="e.g. Frontend canvas performance and user workflow testing"
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#15161B] border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Assign Squad Members ({selectedGroupMemberIds.length} selected)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedGroupMemberIds(allMembers.map((m) => m._id))}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    <button
                      type="button"
                      onClick={() => setSelectedGroupMemberIds([])}
                      className="text-[11px] text-gray-500 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    value={groupMemberSearchQuery}
                    onChange={(e) => setGroupMemberSearchQuery(e.target.value)}
                    placeholder="Search squad members..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-[#15161B] border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-gray-50/50 dark:bg-[#15161B]/50">
                  {filteredGroupMembers.map((m) => {
                    const isSelected = selectedGroupMemberIds.includes(m._id);
                    return (
                      <div
                        key={m._id}
                        onClick={() => toggleGroupMemberSelection(m._id)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${isSelected
                          ? "bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/60"
                          : "hover:bg-gray-100 dark:hover:bg-[#252830] border border-transparent"
                          }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            {m.initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                              {m.name}
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                              {m.role} • {m.department}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 text-emerald-600">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newGroupName.trim() || isCreatingGroup}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isCreatingGroup ? "Creating..." : "Create Squad Group"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Start Direct 1:1 Chat */}
      {showDirectMemberModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E2026] rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Start 1-to-1 Direct Chat</h3>
                  <p className="text-[11px] text-gray-500">Pick any colleague to start a private conversation</p>
                </div>
              </div>
              <button
                onClick={() => setShowDirectMemberModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={directMemberSearchQuery}
                  onChange={(e) => setDirectMemberSearchQuery(e.target.value)}
                  placeholder="Filter colleague by name or department..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-[#15161B] border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {filteredDirectMembers.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4 italic">No matching colleagues found</p>
                ) : (
                  filteredDirectMembers.map((m) => (
                    <div
                      key={m._id}
                      onClick={() => handleStartDirectChat(m)}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800/50 cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm">
                          {m.initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                            {m.name}
                          </p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                            {m.role} • {m.department}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isCreatingDirect}
                        className="px-2.5 py-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors shrink-0"
                      >
                        Message
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#18191E] flex justify-end">
              <button
                type="button"
                onClick={() => setShowDirectMemberModal(false)}
                className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
