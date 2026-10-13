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
  Crosshair,
  Code,
} from "lucide-react";
import {
  FaFlag,
  FaChartArea,
  FaChartColumn,
  FaGear,
  FaBullseye,
  FaCircleCheck,
  FaHouse,
  FaAddressBook,
  FaLocationDot,
  FaCircleInfo,
  FaBoxOpen,
  FaBrain,
} from "react-icons/fa6";
import { TbFunction, TbMathIntegral } from "react-icons/tb";

// Full namespace packages for dynamic search and resolution across thousands of React Icons
import * as Fa6 from "react-icons/fa6";
import * as Tb from "react-icons/tb";
import * as Md from "react-icons/md";
import * as Lu from "react-icons/lu";

export type IconGroupType =
  | "infra"
  | "flow"
  | "ideation"
  | "logic"
  | "metrics"
  | "media"
  | "react-icons";

export interface IIconGalleryItem {
  id: string;
  name: string;
  iconName: string;
  subtitle: string;
  group: IconGroupType;
  color: string;
  pack?: string;
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
    description: "Database cluster, server compute, endpoints, runtime environments, home & settings",
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
        id: "infra-home",
        name: "Home",
        iconName: "FaHouse",
        subtitle: "Landing page / root directory",
        group: "infra",
        color: "#06B6D4",
      },
      {
        id: "infra-contact",
        name: "Contact",
        iconName: "FaAddressBook",
        subtitle: "Customer outreach & address book",
        group: "infra",
        color: "#14B8A6",
      },
      {
        id: "infra-location",
        name: "Location",
        iconName: "FaLocationDot",
        subtitle: "Geographic point / DC region",
        group: "infra",
        color: "#F59E0B",
      },
      {
        id: "infra-gear",
        name: "Gear",
        iconName: "FaGear",
        subtitle: "System config & parameters",
        group: "infra",
        color: "#94A3B8",
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
        id: "flow-filter",
        name: "Filter",
        iconName: "Filter",
        subtitle: "Criteria sorting and selective routing",
        group: "flow",
        color: "#3B82F6",
      },
      {
        id: "flow-fallback",
        name: "Fallback",
        iconName: "ZapOff",
        subtitle: "Circuit failsafe alternatives",
        group: "flow",
        color: "#F59E0B",
      },
    ],
  },
  {
    type: "ideation",
    title: "Concept Ideation & Brainstorming",
    emoji: "💡",
    description: "Architecture questions, strategic goals, aims, flags & briefings",
    color: "#F59E0B",
    items: [
      {
        id: "ideation-goal",
        name: "Goal",
        iconName: "FaBullseye",
        subtitle: "Key objective & milestone target",
        group: "ideation",
        color: "#EF4444",
      },
      {
        id: "ideation-aim",
        name: "Aim",
        iconName: "Crosshair",
        subtitle: "Strategic focus & vector trajectory",
        group: "ideation",
        color: "#F97316",
      },
      {
        id: "ideation-flag",
        name: "Flag",
        iconName: "FaFlag",
        subtitle: "Feature flag & marker checkpoint",
        group: "ideation",
        color: "#EF4444",
      },
      {
        id: "ideation-about",
        name: "About",
        iconName: "FaCircleInfo",
        subtitle: "Contextual overview & about card",
        group: "ideation",
        color: "#38BDF8",
      },
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
    description: "Executable routines, lambda functions, approved gates, integrals & reasoning",
    color: "#8B5CF6",
    items: [
      {
        id: "logic-approved",
        name: "Approved",
        iconName: "FaCircleCheck",
        subtitle: "Gatekeeper approval & sign-off",
        group: "logic",
        color: "#10B981",
      },
      {
        id: "logic-function",
        name: "Function",
        iconName: "TbFunction",
        subtitle: "Callable routine / lambda logic",
        group: "logic",
        color: "#6366F1",
      },
      {
        id: "logic-code",
        name: "Code",
        iconName: "Code",
        subtitle: "Source script & implementation",
        group: "logic",
        color: "#3B82F6",
      },
      {
        id: "logic-logic",
        name: "Logic",
        iconName: "FaBrain",
        subtitle: "Decision tree & conditional reasoning",
        group: "logic",
        color: "#8B5CF6",
      },
      {
        id: "logic-integral",
        name: "Integral",
        iconName: "TbMathIntegral",
        subtitle: "Mathematical integration / sum logic",
        group: "logic",
        color: "#EC4899",
      },
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
    description: "Workspace billing, products, area charts, column charts & volume trends",
    color: "#3B82F6",
    items: [
      {
        id: "metrics-product",
        name: "Product",
        iconName: "FaBoxOpen",
        subtitle: "Shippable SKU / merchandise",
        group: "metrics",
        color: "#EAB308",
      },
      {
        id: "metrics-chart-area",
        name: "Area Chart",
        iconName: "FaChartArea",
        subtitle: "Cumulative area distribution",
        group: "metrics",
        color: "#8B5CF6",
      },
      {
        id: "metrics-chart-column",
        name: "Column Chart",
        iconName: "FaChartColumn",
        subtitle: "Comparative vertical bars",
        group: "metrics",
        color: "#0EA5E9",
      },
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
        id: "media-halted",
        name: "Halted",
        iconName: "Frown",
        subtitle: "Process interruption / exceptions",
        group: "media",
        color: "#EF4444",
      },
      {
        id: "media-dispatch",
        name: "Dispatch",
        iconName: "Car",
        subtitle: "Logistics or vehicle dispatch tasks",
        group: "media",
        color: "#10B981",
      },
    ],
  },
];

// Curated icon component lookup dictionary
export const ICON_COMPONENT_MAP: Record<
  string,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
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
  FaHouse,
  FaAddressBook,
  FaLocationDot,
  FaGear,

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
  FaBullseye,
  Crosshair,
  FaFlag,
  FaCircleInfo,
  HelpCircle,
  Lightbulb,
  MessageSquareText,
  Sparkles,
  Wand2,
  Flame,

  // 4. Logic
  FaCircleCheck,
  TbFunction,
  Code,
  FaBrain,
  TbMathIntegral,
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
  FaBoxOpen,
  FaChartArea,
  FaChartColumn,
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

/**
 * Universal dynamic resolver for both preset Lucide icons and any React-Icons (FA6, Tabler, Material, Lucide)
 */
export function resolveDynamicReactIcon(
  iconName?: string
): React.ComponentType<{ className?: string; style?: React.CSSProperties }> | null {
  if (!iconName) return null;
  if (ICON_COMPONENT_MAP[iconName]) return ICON_COMPONENT_MAP[iconName];

  // Dynamic prefix lookup
  if (iconName.startsWith("Fa") && (Fa6 as any)[iconName]) return (Fa6 as any)[iconName];
  if (iconName.startsWith("Tb") && (Tb as any)[iconName]) return (Tb as any)[iconName];
  if (iconName.startsWith("Md") && (Md as any)[iconName]) return (Md as any)[iconName];
  if (iconName.startsWith("Lu") && (Lu as any)[iconName]) return (Lu as any)[iconName];

  // General lookup across icon packs
  const fallback =
    (Fa6 as any)[iconName] ||
    (Tb as any)[iconName] ||
    (Md as any)[iconName] ||
    (Lu as any)[iconName];

  return fallback || null;
}

export function getWhiteboardIcon(
  iconName?: string
): React.ComponentType<{ className?: string; style?: React.CSSProperties }> {
  if (!iconName) return Boxes;
  const resolved = resolveDynamicReactIcon(iconName);
  return resolved || Boxes;
}

// Backward-compatible alias
export const getLucideIcon = getWhiteboardIcon;

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

export interface IDynamicReactIconItem {
  id: string;
  name: string;
  iconName: string;
  pack: string;
  color: string;
  subtitle: string;
  group: IconGroupType;
}

/**
 * Searches across thousands of built-in React Icons dynamically by keyword
 */
export function searchDynamicReactIcons(
  query: string,
  limit = 48
): IDynamicReactIconItem[] {
  const q = query.trim().toLowerCase();

  // Curated showcase when search box is empty
  if (!q) {
    const popular: Array<{ name: string; iconName: string; pack: string; color: string }> = [
      { name: "Flag Checkpoint", iconName: "FaFlag", pack: "FA6", color: "#EF4444" },
      { name: "Area Chart", iconName: "FaChartArea", pack: "FA6", color: "#8B5CF6" },
      { name: "Column Chart", iconName: "FaChartColumn", pack: "FA6", color: "#0EA5E9" },
      { name: "Gear Config", iconName: "FaGear", pack: "FA6", color: "#94A3B8" },
      { name: "Goal Target", iconName: "FaBullseye", pack: "FA6", color: "#F43F5E" },
      { name: "Aim Crosshair", iconName: "Crosshair", pack: "Lucide", color: "#F97316" },
      { name: "Approved Sign-off", iconName: "FaCircleCheck", pack: "FA6", color: "#10B981" },
      { name: "Function Lambda", iconName: "TbFunction", pack: "Tabler", color: "#6366F1" },
      { name: "Code Script", iconName: "Code", pack: "Lucide", color: "#3B82F6" },
      { name: "Logic Brain", iconName: "FaBrain", pack: "FA6", color: "#A855F7" },
      { name: "Math Integral", iconName: "TbMathIntegral", pack: "Tabler", color: "#EC4899" },
      { name: "Home Dashboard", iconName: "FaHouse", pack: "FA6", color: "#06B6D4" },
      { name: "Contact Book", iconName: "FaAddressBook", pack: "FA6", color: "#14B8A6" },
      { name: "Location Pin", iconName: "FaLocationDot", pack: "FA6", color: "#F59E0B" },
      { name: "About Info", iconName: "FaCircleInfo", pack: "FA6", color: "#38BDF8" },
      { name: "Product Box", iconName: "FaBoxOpen", pack: "FA6", color: "#EAB308" },
      { name: "Rocket Launch", iconName: "MdRocketLaunch", pack: "Material", color: "#FB923C" },
      { name: "Cloud Compute", iconName: "FaCloud", pack: "FA6", color: "#38BDF8" },
      { name: "Shield Security", iconName: "FaShieldHalved", pack: "FA6", color: "#10B981" },
      { name: "Lightning Bolt", iconName: "FaBolt", pack: "FA6", color: "#FBBF24" },
      { name: "Robot AI", iconName: "FaRobot", pack: "FA6", color: "#A78BFA" },
      { name: "Database Store", iconName: "FaDatabase", pack: "FA6", color: "#0EA5E9" },
      { name: "Wifi Signal", iconName: "FaWifi", pack: "FA6", color: "#10B981" },
      { name: "Credit Card", iconName: "FaCreditCard", pack: "FA6", color: "#6366F1" },
    ];

    return popular.map((item) => ({
      id: `dyn-${item.iconName.toLowerCase()}`,
      name: item.name,
      iconName: item.iconName,
      pack: item.pack,
      color: item.color,
      subtitle: `${item.pack} • ${item.iconName}`,
      group: "react-icons",
    }));
  }

  const results: IDynamicReactIconItem[] = [];
  const seen = new Set<string>();

  const scan = (packObj: Record<string, any>, packName: string, color: string) => {
    for (const key of Object.keys(packObj)) {
      if (key === "default" || seen.has(key)) continue;
      if (key.toLowerCase().includes(q)) {
        seen.add(key);
        let displayName = key;
        if (key.startsWith("Fa6")) displayName = key.slice(3);
        else if (key.startsWith("Fa") || key.startsWith("Tb") || key.startsWith("Md") || key.startsWith("Lu")) {
          displayName = key.slice(2);
        }
        displayName = displayName.replace(/([A-Z])/g, " $1").trim() || key;

        results.push({
          id: `dyn-${key.toLowerCase()}`,
          name: displayName,
          iconName: key,
          pack: packName,
          color,
          subtitle: `${packName} • ${key}`,
          group: "react-icons",
        });
        if (results.length >= limit) return true;
      }
    }
    return false;
  };

  if (!scan(Fa6, "FA6", "#EF4444")) {
    if (!scan(Tb, "Tabler", "#6366F1")) {
      if (!scan(Md, "Material", "#0EA5E9")) {
        scan(Lu, "Lucide", "#10B981");
      }
    }
  }

  return results;
}
