import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Company, User } from "@/models";
import { getNextAuthUser } from "@/server/middleware/auth";
import { evaluateSubscriptionStatus } from "@/lib/subscriptionReminder";

export async function GET(req: NextRequest) {
  const sessionUser = await getNextAuthUser(req);

  if (!sessionUser) {
    return NextResponse.json({
      success: true,
      authenticated: false,
      user: null,
      company: null,
      permissions: null,
    });
  }

  await connectToDatabase();
  const user = await User.findById(sessionUser.userId);
  const company = sessionUser.companyId ? await Company.findById(sessionUser.companyId) : null;

    const baseSubscription = company?.subscription
      ? evaluateSubscriptionStatus(company.subscription)
      : null;
    let subscriptionInfo: any = baseSubscription;
    if (company && baseSubscription) {
      const totalSeats = Math.max(1, Number(company.subscription?.userCount) || 1);
      const filledSeats = await User.countDocuments({ companyId: company._id });
      subscriptionInfo = {
        ...baseSubscription,
        totalSeats,
        filledSeats,
        availableSeats: Math.max(0, totalSeats - filledSeats),
      };
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: user
        ? {
            _id: user._id.toString(),
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            position: user.position || "",
            companyId: user.companyId ? user.companyId.toString() : null,
            rank: user.rank || "1",
            status: user.status || "Working",
            joinedDate: user.joinedDate ? new Date(user.joinedDate).toISOString() : null,
            details: user.details || "",
            performanceScore: user.performanceScore ?? 82,
            completedProjectsCount: user.completedProjectsCount ?? 0,
            currentProjectsCount: user.currentProjectsCount ?? 1,
            relevancyScore: user.relevancyScore ?? 85,
            supervisorRating: user.supervisorRating ?? 4.2,
            teamLeadRating: user.teamLeadRating ?? 4.3,
            remarks: user.remarks || "",
          }
        : sessionUser,
      company: company
        ? {
            id: company._id,
            name: company.name,
            code: company.companyCode,
            slug: company.slug,
            status: company.status,
            subscription: subscriptionInfo,
          }
        : null,
    permissions: {
      isSuperuser: sessionUser.role === "superuser",
      canManageCompany: ["superuser", "owner"].includes(sessionUser.role),
      canManageProjects: ["superuser", "owner", "manager"].includes(sessionUser.role),
      canAssignTasks: ["superuser", "owner", "manager", "teamlead"].includes(sessionUser.role),
      isEmployeeOnly: sessionUser.role === "employee",
    },
  });
}
