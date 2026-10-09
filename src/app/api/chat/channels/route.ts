import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { ChatChannel, User, Team } from "@/models";
import { getCurrentSession, getTenantQueryFilter } from "@/server/auth/session";

// Predefined seed channels with member allocations
const SEED_TEAMS = [
  {
    channelId: "team-engineering",
    name: "Engineering",
    type: "team" as const,
    description: "Architecture, sprints, and code reviews",
    memberEmails: ["satyamhimesh@gmail.com", "elena.rostova@company.io", "david.kim@company.io", "priya.patel@company.io"],
    members: [
      { userId: "m-satyam", name: "Satyam Himesh", email: "satyamhimesh@gmail.com", role: "Superuser / Lead Architect", department: "Architecture & Core", avatar: "SH" },
      { userId: "m-elena", name: "Elena Rostova", email: "elena.rostova@company.io", role: "Principal Cloud Engineer", department: "Infrastructure & AWS", avatar: "ER" },
      { userId: "m-david", name: "David Kim", email: "david.kim@company.io", role: "Staff Frontend Engineer", department: "UI / Canvas Engineering", avatar: "DK" },
      { userId: "m-priya", name: "Priya Patel", email: "priya.patel@company.io", role: "QA & Reliability Lead", department: "Quality Assurance", avatar: "PP" },
    ],
  },
  {
    channelId: "team-product-design",
    name: "Product & Design",
    type: "team" as const,
    description: "Product roadmap, UX/UI, wireframes",
    memberEmails: ["satyamhimesh@gmail.com", "marcus.chen@company.io", "chloe.bennett@company.io"],
    members: [
      { userId: "m-satyam", name: "Satyam Himesh", email: "satyamhimesh@gmail.com", role: "Superuser / Lead Architect", department: "Architecture & Core", avatar: "SH" },
      { userId: "m-marcus", name: "Marcus Chen", email: "marcus.chen@company.io", role: "Product Manager", department: "Product & Strategy", avatar: "MC" },
      { userId: "m-chloe", name: "Chloe Bennett", email: "chloe.bennett@company.io", role: "UI/UX Visual Designer", department: "Design & UX", avatar: "CB" },
    ],
  },
  {
    channelId: "team-sales-marketing",
    name: "Sales & Marketing",
    type: "team" as const,
    description: "Client leads, pipeline revenue",
    memberEmails: ["satyamhimesh@gmail.com", "alex.morgan@company.io", "sarah.jenkins@company.io"],
    members: [
      { userId: "m-satyam", name: "Satyam Himesh", email: "satyamhimesh@gmail.com", role: "Superuser / Lead Architect", department: "Architecture & Core", avatar: "SH" },
      { userId: "m-alex", name: "Alex Morgan", email: "alex.morgan@company.io", role: "Growth Operations Specialist", department: "Revenue & Sales", avatar: "AM" },
      { userId: "m-sarah", name: "Sarah Jenkins", email: "sarah.jenkins@company.io", role: "VP of Engineering", department: "Executive", avatar: "SJ" },
    ],
  },
  {
    channelId: "team-executive",
    name: "Executive Leadership",
    type: "team" as const,
    description: "Strategic initiatives & OKR status",
    memberEmails: ["satyamhimesh@gmail.com", "sarah.jenkins@company.io"],
    members: [
      { userId: "m-satyam", name: "Satyam Himesh", email: "satyamhimesh@gmail.com", role: "Superuser / Lead Architect", department: "Architecture & Core", avatar: "SH" },
      { userId: "m-sarah", name: "Sarah Jenkins", email: "sarah.jenkins@company.io", role: "VP of Engineering", department: "Executive", avatar: "SJ" },
    ],
  },
];

const SEED_GROUPS = [
  {
    channelId: "group-frontend-squad",
    name: "frontend-squad",
    type: "group" as const,
    description: "Whiteboard canvas & Next.js frontend",
    memberEmails: ["satyamhimesh@gmail.com", "david.kim@company.io", "elena.rostova@company.io"],
    members: [
      { userId: "m-satyam", name: "Satyam Himesh", email: "satyamhimesh@gmail.com", role: "Superuser / Lead Architect", department: "Architecture & Core", avatar: "SH" },
      { userId: "m-david", name: "David Kim", email: "david.kim@company.io", role: "Staff Frontend Engineer", department: "UI / Canvas Engineering", avatar: "DK" },
      { userId: "m-elena", name: "Elena Rostova", email: "elena.rostova@company.io", role: "Principal Cloud Engineer", department: "Infrastructure & AWS", avatar: "ER" },
    ],
  },
  {
    channelId: "group-mobile-app-v2",
    name: "mobile-app-v2",
    type: "group" as const,
    description: "React Native & push telemetry",
    memberEmails: ["satyamhimesh@gmail.com", "marcus.chen@company.io", "priya.patel@company.io"],
    members: [
      { userId: "m-satyam", name: "Satyam Himesh", email: "satyamhimesh@gmail.com", role: "Superuser / Lead Architect", department: "Architecture & Core", avatar: "SH" },
      { userId: "m-marcus", name: "Marcus Chen", email: "marcus.chen@company.io", role: "Product Manager", department: "Product & Strategy", avatar: "MC" },
      { userId: "m-priya", name: "Priya Patel", email: "priya.patel@company.io", role: "QA & Reliability Lead", department: "Quality Assurance", avatar: "PP" },
    ],
  },
  {
    channelId: "group-q4-release",
    name: "q4-release",
    type: "group" as const,
    description: "Q4 enterprise hardening war room",
    memberEmails: ["satyamhimesh@gmail.com", "sarah.jenkins@company.io", "elena.rostova@company.io", "marcus.chen@company.io"],
    members: [
      { userId: "m-satyam", name: "Satyam Himesh", email: "satyamhimesh@gmail.com", role: "Superuser / Lead Architect", department: "Architecture & Core", avatar: "SH" },
      { userId: "m-sarah", name: "Sarah Jenkins", email: "sarah.jenkins@company.io", role: "VP of Engineering", department: "Executive", avatar: "SJ" },
      { userId: "m-elena", name: "Elena Rostova", email: "elena.rostova@company.io", role: "Principal Cloud Engineer", department: "Infrastructure & AWS", avatar: "ER" },
      { userId: "m-marcus", name: "Marcus Chen", email: "marcus.chen@company.io", role: "Product Manager", department: "Product & Strategy", avatar: "MC" },
    ],
  },
];

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getCurrentSession();
    const tenantFilter = getTenantQueryFilter(session);

    const userEmail = (session.email || "").toLowerCase();
    const userId = session.userId || "anonymous";
    const userRole = (session.role || "").toLowerCase();
    const isElevated = userRole === "owner" || userRole === "admin" || userRole.includes("super");

    // 1. Ensure seed channels exist in DB if table is empty for company
    const existingCount = await ChatChannel.countDocuments(tenantFilter);
    if (existingCount === 0 && session.companyId) {
      try {
        const seedPayloads = [
          ...SEED_TEAMS.map((t) => ({
            ...t,
            companyId: session.companyId,
            createdBy: "system",
            creatorName: "TaskPMS System",
            memberIds: t.members.map((m) => m.userId),
            isDefault: true,
          })),
          ...SEED_GROUPS.map((g) => ({
            ...g,
            companyId: session.companyId,
            createdBy: "system",
            creatorName: "TaskPMS System",
            memberIds: g.members.map((m) => m.userId),
            isDefault: true,
          })),
        ];
        await ChatChannel.insertMany(seedPayloads);
      } catch (seedErr) {
        console.warn("Could not seed default channels:", seedErr);
      }
    }

    // 2. Query all channels for company
    const allChannels = await ChatChannel.find(tenantFilter).sort({ createdAt: 1 }).lean();

    // 3. User Membership Filtering (User requirement: "thses team groups, members will shows to whom those are added on those group , teams")
    // If elevated (owner/admin), they have visibility across company channels, but we still mark membership status.
    // For regular users, they ONLY see channels where they are added as a member or creator!
    const isMemberOf = (ch: any) => {
      if (ch.isDefault && isElevated) return true;
      if (ch.createdBy === userId) return true;
      if (ch.memberIds && ch.memberIds.includes(userId)) return true;
      if (ch.memberEmails && ch.memberEmails.map((e: string) => e.toLowerCase()).includes(userEmail)) return true;
      if (ch.members && ch.members.some((m: any) => m.userId === userId || m.email?.toLowerCase() === userEmail)) return true;
      return false;
    };

    // Filter teams: visible if user is a member (or elevated admin)
    const teams = allChannels
      .filter((ch) => ch.type === "team")
      .filter((ch) => isElevated || isMemberOf(ch))
      .map((ch) => ({
        ...ch,
        isUserMember: isMemberOf(ch),
      }));

    // Filter groups: visible ONLY if user is a member (or elevated admin)
    const groups = allChannels
      .filter((ch) => ch.type === "group")
      .filter((ch) => isElevated || isMemberOf(ch))
      .map((ch) => ({
        ...ch,
        isUserMember: isMemberOf(ch),
      }));

    // Filter direct messages: visible ONLY if user is a participant
    const directs = allChannels
      .filter((ch) => ch.type === "direct")
      .filter((ch) => isMemberOf(ch))
      .map((ch) => ({
        ...ch,
        isUserMember: true,
      }));

    return NextResponse.json({
      success: true,
      teams,
      groups,
      directs,
    });
  } catch (error: any) {
    console.error("Failed to fetch chat channels:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch channels" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getCurrentSession();

    if (!session.userId || session.isGuest) {
      return NextResponse.json(
        { success: false, error: "Authentication required to create teams or groups" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { type, name, description = "", memberIds = [], members = [] } = body;

    if (!type || !["team", "group", "direct"].includes(type)) {
      return NextResponse.json({ success: false, error: "Invalid channel type" }, { status: 400 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
    }

    const currentUserName = session.name || session.email?.split("@")[0] || "User";
    const currentUserEmail = session.email || "";
    const currentUserRole = session.role || "Member";
    const userInitials = currentUserName
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    // Current user object
    const currentUserMember = {
      userId: session.userId,
      name: currentUserName,
      email: currentUserEmail,
      role: currentUserRole,
      department: "General",
      avatar: userInitials,
    };

    // Ensure current user is in members list
    const combinedMembersMap = new Map<string, any>();
    combinedMembersMap.set(session.userId, currentUserMember);

    for (const m of members) {
      if (m && m.userId) {
        combinedMembersMap.set(m.userId, {
          userId: m.userId,
          name: m.name || "Member",
          email: m.email || "",
          role: m.role || "Member",
          department: m.department || "General",
          avatar: m.avatar || m.initials || "U",
        });
      }
    }

    const finalMembers = Array.from(combinedMembersMap.values());
    const finalMemberIds = Array.from(new Set([session.userId, ...memberIds]));
    const finalMemberEmails = Array.from(new Set([currentUserEmail, ...finalMembers.map((m) => m.email).filter(Boolean)]));

    // Handle Direct Chat idempotency: If 1:1 chat already exists between both users, return it
    if (type === "direct") {
      const otherUser = finalMembers.find((m) => m.userId !== session.userId);
      if (otherUser) {
        const existingDirect = await ChatChannel.findOne({
          companyId: session.companyId,
          type: "direct",
          memberIds: { $all: [session.userId, otherUser.userId] },
        }).lean();

        if (existingDirect) {
          return NextResponse.json({
            success: true,
            channel: existingDirect,
            alreadyExisted: true,
          });
        }
      }
    }

    const cleanSlug = name.toLowerCase().trim().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
    const uniqueSuffix = Math.random().toString(36).substring(2, 6);
    const channelId = `${type}-${cleanSlug}-${uniqueSuffix}`;

    const newChannel = await ChatChannel.create({
      companyId: session.companyId,
      channelId,
      name: name.trim(),
      type,
      description: description.trim(),
      createdBy: session.userId,
      creatorName: currentUserName,
      memberIds: finalMemberIds,
      memberEmails: finalMemberEmails,
      members: finalMembers,
      isDefault: false,
    });

    // If creating a team, optionally link with Team model
    if (type === "team" && session.companyId) {
      try {
        await Team.create({
          name: name.trim(),
          description: description.trim(),
          companyId: session.companyId,
          leadId: session.userId,
          members: finalMemberIds.filter((id) => id.length === 24), // only valid ObjectId strings
        });
      } catch (err) {
        console.warn("Could not sync to Team collection:", err);
      }
    }

    return NextResponse.json({
      success: true,
      channel: newChannel,
    });
  } catch (error: any) {
    console.error("Failed to create chat channel:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create channel" },
      { status: 500 }
    );
  }
}
