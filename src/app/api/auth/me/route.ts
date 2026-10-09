import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import { Company, User } from "@/models";
import { getNextAuthUser } from "@/server/middleware/auth";
import { evaluateSubscriptionStatus } from "@/lib/subscriptionReminder";

export async function GET(req: NextRequest) {
  let sessionUser;
  try {
    sessionUser = await getNextAuthUser(req);
  } catch {
    sessionUser = null;
  }

  if (!sessionUser) {
    return NextResponse.json({
      success: true,
      authenticated: false,
      user: null,
      company: null,
      permissions: null,
    });
  }

  try {
    await connectToDatabase();
    // Developer-bypass sessions carry synthetic ids like "dev_root_ORGTTU"
    // (or "master_developer_root") that are not Mongo ObjectIds — querying
    // with them throws CastError and 500s every client poll. Guard first and
    // fall back to the verified JWT payload below.
    const userId = sessionUser.userId;
    const user =
      userId && mongoose.isValidObjectId(userId) ? await User.findById(userId) : null;
    const rawCompanyId = (sessionUser as any).companyId;
    const company =
      rawCompanyId && mongoose.isValidObjectId(rawCompanyId)
        ? await Company.findById(rawCompanyId)
        : null;

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
  } catch (error: any) {
    // Never crash with an unhandled CastError/DB error — clients poll this
    // endpoint continuously, so fail closed with JSON instead of a 500 toss.
    console.error("auth/me error:", error?.message || error);
    return NextResponse.json(
      { success: false, authenticated: false, user: null, company: null, permissions: null },
      { status: 500 }
    );
  }
}
