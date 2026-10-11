import React from "react";
import {
  Database,
  Webhook,
  Plug,
  Globe,
  Server,
  Laptop,
  Monitor,
  User,
  UserCheck,
  DoorOpen,
  LockKeyhole,
  GitFork,
  MoveRight,
  RefreshCw,
  Shuffle,
  Link as LucideLink,
  Infinity as LucideInfinity,
  Link2Off,
  Scissors,
  Spline,
  Workflow,
  Filter,
  Bomb,
  ZapOff,
  HelpCircle,
  Lightbulb,
  MessageSquareText,
  Sparkles,
  Wand2,
  Flame,
  Key,
  Braces,
  Hash,
  Binary,
  Columns2,
  Crown,
  GitBranch,
  Fingerprint,
  Lock,
  ShieldCheck,
  Component,
  Box,
  Coins,
  DollarSign,
  Percent,
  Activity,
  TrendingUp,
  ArrowUpRight,
  TrendingDown,
  ArrowDownRight,
  LineChart,
  Sliders,
  ArrowLeftRight,
  Layers,
  Dices,
  Equal,
  Radio,
  Play,
  Pause,
  Music,
  LogOut,
  Frown,
  Car,
  Boxes,
} from "lucide-react";

export type IconGroupType = "infra" | "flow" | "ideation" | "logic" | "metrics" | "media";

export interface IIconGalleryItem {
  id: string;
  name: string;
  iconName: string;
  subtitle: string;
  group: IconGroupType;
  color: string;
}

export interface IIconGalleryGroup {
  type: IconGroupType;
  title: string;
  emoji: string;
  description: string;
  color: string;
  items: IIconGalleryItem[];
}

export const ICON_GALLERY_GROUPS: IIconGalleryGroup[] = [
  {
    type: "infra",
    title: "Infrastructure & Networking",
    emoji: "🌐",
    description: "Database cluster, server compute, endpoints, runtime environments & auth gates",
    color: "#0EA5E9",
    items: [
      {
        id: "infra-database",
        name: "Database",
        iconName: "Database",
        subtitle: "For MongoDB cluster / storage tier",
        group: "infra",
        color: "#0EA5E9",
      },
      {
        id: "infra-api",
        name: "API",
        iconName: "Webhook",
        subtitle: "For endpoints and data gates",
        group: "infra",
        color: "#06B6D4",
      },
      {
        id: "infra-browser",
        name: "Browser",
        iconName: "Globe",
        subtitle: "Web preview / client runtime environment",
        group: "infra",
        color: "#3B82F6",
      },
      {
        id: "infra-server",
        name: "Server",
        iconName: "Server",
        subtitle: "Express / Node compute instances",
        group: "infra",
        color: "#6366F1",
      },
      {
        id: "infra-client",
        name: "Client",
        iconName: "Laptop",
        subtitle: "Consumer frontend tier",
        group: "infra",
        color: "#8B5CF6",
      },
      {
        id: "infra-user",
        name: "User",
        iconName: "UserCheck",
        subtitle: "Active account node",
        group: "infra",
        color: "#10B981",
      },
      {
        id: "infra-gate",
        name: "Gate",
        iconName: "DoorOpen",
        subtitle: "Auth checkpoints / request filters",
        group: "infra",
        color: "#F59E0B",
      },
    ],
  },
  {
    type: "flow",
    title: "Routing, State & Data Pipelines",
    emoji: "🔄",
    description: "Path trajectories, fallbacks, circuit breakers, CI/CD engines & funnels",
    color: "#10B981",
    items: [
      {
        id: "flow-route",
        name: "Route",
        iconName: "GitFork",
        subtitle: "Standard path trajectory",
        group: "flow",
        color: "#10B981",
      },
      {
        id: "flow-reroute",
        name: "Re-route",
        iconName: "RefreshCw",
        subtitle: "Error handlers and request fallbacks",
        group: "flow",
        color: "#14B8A6",
      },
      {
        id: "flow-connect",
        name: "Connect",
        iconName: "Link",
        subtitle: "Active pipeline linkage",
        group: "flow",
        color: "#06B6D4",
      },
      {
        id: "flow-break",
        name: "Break",
        iconName: "Link2Off",
        subtitle: "Circuit breakers / disconnected states",
        group: "flow",
        color: "#EF4444",
      },
      {
        id: "flow-pipeline",
        name: "Pipeline",
        iconName: "Workflow",
        subtitle: "CI/CD tracks or task processing engines",
        group: "flow",
        color: "#8B5CF6",
      },
      {
        id: "flow-funnel",
        name: "Funnel",
        iconName: "Filter",
        subtitle: "User acquisition / conversion paths",
        group: "flow",
        color: "#F59E0B",
      },
      {
        id: "flow-crash",
        name: "Crash",
        iconName: "Bomb",
        subtitle: "Server error downtime indicators",
        group: "flow",
        color: "#F43F5E",
      },
    ],
  },
  {
    type: "ideation",
    title: "Concept Ideation & Brainstorming",
    emoji: "💡",
    description: "Architecture questions, feature proposals, feedback bubbles & launchpad triggers",
    color: "#F59E0B",
    items: [
      {
        id: "ideation-question",
        name: "Question",
        iconName: "HelpCircle",
        subtitle: "Unresolved issues / architecture questions",
        group: "ideation",
        color: "#F59E0B",
      },
      {
        id: "ideation-idea",
        name: "Idea",
        iconName: "Lightbulb",
        subtitle: "Feature proposals / new solutions",
        group: "ideation",
        color: "#EAB308",
      },
      {
        id: "ideation-thoughts",
        name: "Thoughts",
        iconName: "MessageSquareText",
        subtitle: "Feedback bubbles / review logs",
        group: "ideation",
        color: "#38BDF8",
      },
      {
        id: "ideation-imagine",
        name: "Imagine",
        iconName: "Sparkles",
        subtitle: "Experimental scope drafts",
        group: "ideation",
        color: "#A855F7",
      },
      {
        id: "ideation-kick",
        name: "Kick",
        iconName: "Flame",
        subtitle: "Project launchpad triggers / actions",
        group: "ideation",
        color: "#F97316",
      },
    ],
  },
  {
    type: "logic",
    title: "Logic, Variables & Scaling Data",
    emoji: "🔢",
    description: "Lookup keys, target values, cluster coordinators, encrypted records & payload boxes",
    color: "#8B5CF6",
    items: [
      {
        id: "logic-key",
        name: "Key",
        iconName: "Key",
        subtitle: "Lookup keys / object properties",
        group: "logic",
        color: "#EAB308",
      },
      {
        id: "logic-value",
        name: "Value",
        iconName: "Hash",
        subtitle: "Raw string or numeric targets",
        group: "logic",
        color: "#06B6D4",
      },
      {
        id: "logic-pair",
        name: "Pair",
        iconName: "Binary",
        subtitle: "Key-value bound elements",
        group: "logic",
        color: "#3B82F6",
      },
      {
        id: "logic-master",
        name: "Master",
        iconName: "Crown",
        subtitle: "Primary repository branch / cluster coordinator",
        group: "logic",
        color: "#F59E0B",
      },
      {
        id: "logic-hash",
        name: "Hash",
        iconName: "Fingerprint",
        subtitle: "Unique identifier tracking strings",
        group: "logic",
        color: "#10B981",
      },
      {
        id: "logic-encrypted",
        name: "Encrypted",
        iconName: "ShieldCheck",
        subtitle: "Protected records / secure fields",
        group: "logic",
        color: "#22C55E",
      },
      {
        id: "logic-substance",
        name: "Substance",
        iconName: "Box",
        subtitle: "Payload content structures",
        group: "logic",
        color: "#8B5CF6",
      },
    ],
  },
  {
    type: "metrics",
    title: "Metrics, Value & Tracking",
    emoji: "📊",
    description: "Workspace billing, throughput rates, peak spikes, timeline trends & validation balances",
    color: "#3B82F6",
    items: [
      {
        id: "metrics-price",
        name: "Price",
        iconName: "DollarSign",
        subtitle: "Workspace billing / package cost nodes",
        group: "metrics",
        color: "#10B981",
      },
      {
        id: "metrics-rate",
        name: "Rate",
        iconName: "Activity",
        subtitle: "System throughput speeds / server metrics",
        group: "metrics",
        color: "#06B6D4",
      },
      {
        id: "metrics-high",
        name: "High",
        iconName: "TrendingUp",
        subtitle: "Performance peak spikes",
        group: "metrics",
        color: "#22C55E",
      },
      {
        id: "metrics-low",
        name: "Low",
        iconName: "TrendingDown",
        subtitle: "Under-performing drops",
        group: "metrics",
        color: "#EF4444",
      },
      {
        id: "metrics-trend",
        name: "Trend",
        iconName: "LineChart",
        subtitle: "Data movement graphs over timeline",
        group: "metrics",
        color: "#3B82F6",
      },
      {
        id: "metrics-range",
        name: "Range",
        iconName: "Sliders",
        subtitle: "Borders / value limits",
        group: "metrics",
        color: "#A855F7",
      },
      {
        id: "metrics-variety",
        name: "Variety",
        iconName: "Layers",
        subtitle: "Diverse element configuration arrays",
        group: "metrics",
        color: "#6366F1",
      },
      {
        id: "metrics-random",
        name: "Random",
        iconName: "Dices",
        subtitle: "Dynamic testing parameters",
        group: "metrics",
        color: "#EC4899",
      },
      {
        id: "metrics-equal",
        name: "Equal",
        iconName: "Equal",
        subtitle: "Condition validation balances",
        group: "metrics",
        color: "#F59E0B",
      },
    ],
  },
  {
    type: "media",
    title: "Media & System Feedback",
    emoji: "🎭",
    description: "Real-time broadcasts, runner executions, hold states, timeouts & fleet logistics",
    color: "#EC4899",
    items: [
      {
        id: "media-live",
        name: "Live",
        iconName: "Radio",
        subtitle: "Active real-time communication events",
        group: "media",
        color: "#EF4444",
      },
      {
        id: "media-play",
        name: "Play",
        iconName: "Play",
        subtitle: "Start script executions",
        group: "media",
        color: "#22C55E",
      },
      {
        id: "media-pause",
        name: "Pause",
        iconName: "Pause",
        subtitle: "Hold state runners",
        group: "media",
        color: "#F59E0B",
      },
      {
        id: "media-music",
        name: "Music",
        iconName: "Music",
        subtitle: "Audio triggers",
        group: "media",
        color: "#EC4899",
      },
      {
        id: "media-exited",
        name: "Exited",
        iconName: "LogOut",
        subtitle: "Session timeouts / system departures",
        group: "media",
        color: "#6B7280",
      },
      {
        id: "media-bored",
        name: "Bored",
        iconName: "Frown",
        subtitle: "Low engagement warning nodes",
        group: "media",
        color: "#F97316",
      },
      {
        id: "media-car",
        name: "Car",
        iconName: "Car",
        subtitle: "Vehicular logistics or delivery trackers",
        group: "media",
        color: "#0EA5E9",
      },
    ],
  },
];

// Map of string identifier to Lucide Icon component
export const ICON_COMPONENT_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  // 1. Infra
  Database,
  Webhook,
  Plug,
  Globe,
  Server,
  Laptop,
  Monitor,
  User,
  UserCheck,
  DoorOpen,
  LockKeyhole,
  // 2. Flow
  GitFork,
  MoveRight,
  RefreshCw,
  Shuffle,
  Link: LucideLink,
  Infinity: LucideInfinity,
  Link2Off,
  Scissors,
  Spline,
  Workflow,
  Filter,
  Bomb,
  ZapOff,
  // 3. Ideation
  HelpCircle,
  Lightbulb,
  MessageSquareText,
  Sparkles,
  Wand2,
  Flame,
  // 4. Logic
  Key,
  Braces,
  Hash,
  Binary,
  Columns2,
  Crown,
  GitBranch,
  Fingerprint,
  Lock,
  ShieldCheck,
  Component,
  Box,
  // 5. Metrics
  Coins,
  DollarSign,
  Percent,
  Activity,
  TrendingUp,
  ArrowUpRight,
  TrendingDown,
  ArrowDownRight,
  LineChart,
  Sliders,
  ArrowLeftRight,
  Layers,
  Dices,
  Equal,
  // 6. Media
  Radio,
  Play,
  Pause,
  Music,
  LogOut,
  Frown,
  Car,
  // Default fallback
  Boxes,
};

export function getLucideIcon(iconName?: string): React.ComponentType<{ className?: string; style?: React.CSSProperties }> {
  if (!iconName) return Boxes;
  return ICON_COMPONENT_MAP[iconName] || Boxes;
}

export function getAllIconGalleryItems(): IIconGalleryItem[] {
  return ICON_GALLERY_GROUPS.flatMap((g) => g.items);
}

export function filterIconGalleryItems(
  query: string,
  selectedGroup: IconGroupType | "all" = "all"
): IIconGalleryItem[] {
  const normalizedQuery = query.trim().toLowerCase();
  let list = getAllIconGalleryItems();

  if (selectedGroup !== "all") {
    list = list.filter((item) => item.group === selectedGroup);
  }

  if (normalizedQuery) {
    list = list.filter(
      (item) =>
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.subtitle.toLowerCase().includes(normalizedQuery) ||
        item.iconName.toLowerCase().includes(normalizedQuery) ||
        item.group.toLowerCase().includes(normalizedQuery)
    );
  }

  return list;
}
