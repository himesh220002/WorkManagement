import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { User } from "@/models";
import { getCurrentSession, getTenantQueryFilter } from "@/server/auth/session";

const FALLBACK_TEAM_MEMBERS = [
  { _id: "m-satyam", name: "Satyam Himesh", email: "satyamhimesh@gmail.com", role: "Superuser / Lead Architect", department: "Architecture & Core" },
  { _id: "m-marcus", name: "Marcus Chen", email: "marcus.chen@company.io", role: "Product Manager", department: "Product & Strategy" },
  { _id: "m-elena", name: "Elena Rostova", email: "elena.rostova@company.io", role: "Principal Cloud Engineer", department: "Infrastructure & AWS" },
  { _id: "m-sarah", name: "Sarah Jenkins", email: "sarah.jenkins@company.io", role: "VP of Engineering", department: "Executive" },
  { _id: "m-david", name: "David Kim", email: "david.kim@company.io", role: "Staff Frontend Engineer", department: "UI / Canvas Engineering" },
  { _id: "m-priya", name: "Priya Patel", email: "priya.patel@company.io", role: "QA & Reliability Lead", department: "Quality Assurance" },
  { _id: "m-alex", name: "Alex Morgan", email: "alex.morgan@company.io", role: "Growth Operations Specialist", department: "Revenue & Sales" },
  { _id: "m-chloe", name: "Chloe Bennett", email: "chloe.bennett@company.io", role: "UI/UX Visual Designer", department: "Design & UX" },
];

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getCurrentSession();
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").trim().toLowerCase();

    const tenantFilter = getTenantQueryFilter(session);
    const dbUsers = await User.find(tenantFilter)
      .select("_id name email role department")
      .limit(50)
      .lean();

    // Map DB users
    const mappedDbUsers = dbUsers.map((u: any) => ({
      _id: u._id.toString(),
      name: u.name || u.email?.split("@")[0] || "User",
      email: u.email || "",
      role: u.role || "Member",
      department: u.department || "General",
      initials: (u.name || u.email || "U")
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
    }));

    // Combine with fallback teammates if DB has few users so @mention suggestions are vibrant
    const combinedMap = new Map<string, any>();
    for (const u of mappedDbUsers) {
      combinedMap.set(u.email.toLowerCase() || u._id, u);
    }

    for (const fb of FALLBACK_TEAM_MEMBERS) {
      if (!combinedMap.has(fb.email.toLowerCase())) {
        combinedMap.set(fb.email.toLowerCase(), {
          ...fb,
          initials: fb.name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2),
        });
      }
    }

    let allMembers = Array.from(combinedMap.values());

    if (query) {
      allMembers = allMembers.filter((m) =>
        m.name.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query) ||
        (m.role && m.role.toLowerCase().includes(query)) ||
        (m.department && m.department.toLowerCase().includes(query))
      );
    }

    return NextResponse.json({
      success: true,
      members: allMembers,
    });
  } catch (error: any) {
    console.error("Failed to fetch chat members:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch members" },
      { status: 500 }
    );
  }
}
