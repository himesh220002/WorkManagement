"use server";

import connectToDatabase from "@/lib/mongodb";
import { User, Team, Project, Company } from "@/models";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/server/auth/session";
import { syncTenantWrite } from "@/lib/tenantDb";
import {
  canProvisionMemberRole,
  canUpdateMemberRole,
  canAssignProjectStaff,
  canEditProjectAgendasAndTimelines,
  canReviewProjectChangeRequest,
  canArchiveMember,
  canResignMember,
  normalizeRole,
} from "@/server/auth/rbac";
import { UserStatus } from "@/models/enums";

export interface ActionResult<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

/**
 * 1. Provision Member Action:
 * Manager or Owner registers a new employee or team lead with login credentials.
 */
export async function provisionMemberAction(formData: FormData): Promise<ActionResult> {
  await connectToDatabase();
  const session = await getCurrentSession();
  if (session.isGuest || !session.userId) {
    return {
      success: false,
      error: "Authentication required. Please log in or subscribe to provision accounts.",
    };
  }

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.toLowerCase().trim();
  const password = (formData.get("password") as string)?.trim();
  const rawRole = (formData.get("role") as string)?.trim() || "employee";
  const targetRole = normalizeRole(rawRole);
  const category = (formData.get("category") as string)?.trim() || "Developer";
  const position = (formData.get("position") as string)?.trim() || "Staff Member";
  const rank = (formData.get("rank") as string)?.trim() || "2";
  const teamId = (formData.get("teamId") as string)?.trim();
  const projectId = (formData.get("projectId") as string)?.trim();

  if (!name || !email || !password) {
    return {
      success: false,
      error: "Full name, login email, and initial password are required to provision an account.",
    };
  }

  // Enforce RBAC permission
  const check = canProvisionMemberRole(session.role, targetRole);
  if (!check.allowed) {
    return {
      success: false,
      error: check.reason || "Unauthorized to provision this role tier.",
    };
  }

  // Check if email already in use
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return {
      success: false,
      error: `An account with email '${email}' is already registered in the organization.`,
    };
  }

  // Hash initial password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // Resolve active organization boundary & company code
  let companyId = session.companyId;
  let companyCode = session.companyCode;
  let companyName = "TaskFlow Organization";

  if (companyId) {
    const comp = await Company.findById(companyId).select("companyCode name subscription").lean();
    if (comp) {
      companyCode = comp.companyCode || companyCode;
      companyName = comp.name || companyName;

      // Enforce Organization Seat Limit ($3/additional seat quota)
      const maxSeats = Math.max(1, (comp as any).subscription?.userCount || 2);
      const currentUsersCount = await User.countDocuments({ companyId });
      if (currentUsersCount >= maxSeats) {
        return {
          success: false,
          error: `Seat limit reached (${currentUsersCount}/${maxSeats} seats occupied). Please add more seats ($3/seat) to onboard more team members.`,
        };
      }
    }
  } else {
    const firstComp = await Company.findOne().select("companyCode name subscription").lean();
    if (firstComp) {
      companyId = firstComp._id.toString();
      companyCode = firstComp.companyCode;
      companyName = firstComp.name;

      const maxSeats = Math.max(1, (firstComp as any).subscription?.userCount || 2);
      const currentUsersCount = await User.countDocuments({ companyId });
      if (currentUsersCount >= maxSeats) {
        return {
          success: false,
          error: `Seat limit reached (${currentUsersCount}/${maxSeats} seats occupied). Please add more seats ($3/seat) to onboard more team members.`,
        };
      }
    }
  }

  const newUser = await User.create({
    companyId: companyId || undefined,
    name,
    email,
    passwordHash,
    role: targetRole,
    position,
    rank,
    status: "Working",
    capacityHoursPerWeek: 40,
    skills: [category, position],
    joinedDate: new Date(),
    details: `Department: ${category} • Position: ${position} • Initialized by ${session.name} (${session.role})`,
    remarks: "Credentials provisioned upon onboarding.",
  });

  // Link to initial team if provided
  if (teamId) {
    await Team.findByIdAndUpdate(teamId, {
      $addToSet: { members: newUser._id },
    });
  }

  // Link to initial project if provided
  if (projectId) {
    await Project.findByIdAndUpdate(projectId, {
      $addToSet: { memberIds: newUser._id },
    });
  }

  if (companyCode) {
    await syncTenantWrite("User", "create", newUser, undefined, companyCode);
  }

  revalidatePath("/teams");
  revalidatePath("/projects");
  revalidatePath("/diagrams");

  return {
    success: true,
    message: `Account for ${name} successfully created! Initial login credentials ready.`,
    data: {
      userId: newUser._id.toString(),
      name,
      email,
      password,
      role: targetRole,
      position,
      rank,
      companyId: companyId ? companyId.toString() : "",
      companyCode: companyCode || "ORG001",
      companyName: companyName,
    },
  };
}

/**
 * 2. Update Member Role / Tag Action:
 * Manager can update tags between Team Lead and Employee.
 * Owner can update Manager, Team Lead, and Employee.
 * Manager CANNOT alter Owner's tag!
 * Team Lead & Employee CANNOT modify anyone's tag!
 */
export async function updateMemberRoleTagAction(formData: FormData): Promise<ActionResult> {
  await connectToDatabase();
  const session = await getCurrentSession();
  if (session.isGuest || !session.userId) {
    return {
      success: false,
      error: "Authentication required. Please log in or subscribe to update member roles.",
    };
  }

  const userId = formData.get("userId") as string;
  const newRawRole = formData.get("newRole") as string;
  const newRole = normalizeRole(newRawRole);

  if (!userId || !newRole) {
    return { success: false, error: "Target user ID and new role are required." };
  }

  const targetUser = await User.findById(userId);
  if (!targetUser) {
    return { success: false, error: "Target user not found." };
  }

  // Enforce RBAC permission
  const check = canUpdateMemberRole(session.role, targetUser.role, newRole);
  if (!check.allowed) {
    return {
      success: false,
      error: check.reason || "Unauthorized: You do not have permission to modify this user's tag.",
    };
  }

  targetUser.role = newRole;
  targetUser.remarks = `Role updated to ${newRole} by ${session.name} (${session.role}) on ${new Date().toLocaleDateString("en-US")}`;
  await targetUser.save();

  revalidatePath("/teams");
  revalidatePath("/projects");

  return {
    success: true,
    message: `Successfully updated ${targetUser.name}'s tag to ${newRole.toUpperCase()}.`,
    data: {
      userId: targetUser._id.toString(),
      role: newRole,
    },
  };
}

/**
 * 3. Assign Project Team Lead & Members Action:
 * Manager or Owner decides who works on which project and designates the Team Lead.
 */
export async function assignProjectStaffAction(formData: FormData): Promise<ActionResult> {
  await connectToDatabase();
  const session = await getCurrentSession();
  if (session.isGuest || !session.userId) {
    return {
      success: false,
      error: "Authentication required. Please log in or subscribe to assign project staff.",
    };
  }

  const projectId = formData.get("projectId") as string;
  const leadId = formData.get("leadId") as string;
  const memberIds = formData.getAll("memberIds") as string[];

  if (!projectId) {
    return { success: false, error: "Project ID is required." };
  }

  if (!canAssignProjectStaff(session.role)) {
    return {
      success: false,
      error: "Only Managers and Owners have permission to assign project staff and designate Team Leads.",
    };
  }

  const updateData: any = {};
  if (leadId) updateData.leadId = leadId;
  if (memberIds && memberIds.length > 0) updateData.memberIds = memberIds;

  const project = await Project.findByIdAndUpdate(projectId, updateData, { new: true });
  if (!project) {
    return { success: false, error: "Project not found." };
  }

  await syncTenantWrite("Project", "update", projectId, updateData, session.companyCode);

  revalidatePath("/projects");
  revalidatePath("/dev/timeline");

  return {
    success: true,
    message: `Project staff and Team Lead assignment updated for "${project.name}".`,
  };
}

/**
 * 4. Update Project Agendas Action:
 * Managers/Owners can edit directly.
 * Team Leads can edit assigned projects.
 * Employees are blocked (must submit change request).
 */
export async function updateProjectAgendasAction(formData: FormData): Promise<ActionResult> {
  await connectToDatabase();
  const session = await getCurrentSession();
  if (session.isGuest || !session.userId) {
    return {
      success: false,
      error: "Authentication required. Please log in or subscribe to update project agendas.",
    };
  }

  const projectId = formData.get("projectId") as string;
  const agendasRaw = formData.get("agendas") as string;
  const deadlineStr = formData.get("deadline") as string;
  const status = formData.get("status") as string;

  if (!projectId) {
    return { success: false, error: "Project ID is required." };
  }

  const project = await Project.findById(projectId);
  if (!project) {
    return { success: false, error: "Project not found." };
  }

  // Enforce RBAC
  const check = canEditProjectAgendasAndTimelines(session.role, session.userId, project);
  if (!check.allowed) {
    return {
      success: false,
      error:
        check.reason ||
        "Employees cannot modify project agendas or timelines directly. Please submit an Approval Request to your Team Lead.",
    };
  }

  if (agendasRaw !== null && agendasRaw !== undefined) {
    const lines = agendasRaw
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    project.agendas = lines;
  }

  if (deadlineStr) {
    project.deadline = new Date(deadlineStr);
  }

  if (status) {
    project.status = status as any;
  }

  await project.save();
  revalidatePath("/projects");

  return {
    success: true,
    message: `Agendas and timelines updated for "${project.name}".`,
  };
}

/**
 * 5. Submit Project Change Request Action:
 * Employees request changes to project agendas/timelines/scope from the Team Lead.
 */
export async function submitProjectChangeRequestAction(formData: FormData): Promise<ActionResult> {
  await connectToDatabase();
  const session = await getCurrentSession();
  if (session.isGuest || !session.userId) {
    return {
      success: false,
      error: "Authentication required. Please log in or subscribe to submit change requests.",
    };
  }

  const projectId = formData.get("projectId") as string;
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const type = (formData.get("type") as string)?.trim() || "agenda";

  if (!projectId || !title) {
    return { success: false, error: "Project ID and Change Proposal Title are required." };
  }

  const project = await Project.findById(projectId);
  if (!project) {
    return { success: false, error: "Project not found." };
  }

  const requestItem = {
    title,
    description: description || "",
    type: type as any,
    requestedBy: session.userId,
    requesterName: session.name || "Employee",
    status: "Pending" as const,
    createdAt: new Date(),
  };

  project.changeRequests = project.changeRequests || [];
  project.changeRequests.push(requestItem as any);
  await project.save();

  revalidatePath("/projects");

  return {
    success: true,
    message: `Change request "${title}" submitted to Team Lead for review and approval.`,
  };
}

/**
 * 6. Review Project Change Request Action:
 * Team Lead (for their project), Manager, or Owner approves/rejects change requests.
 */
export async function reviewProjectChangeRequestAction(formData: FormData): Promise<ActionResult> {
  await connectToDatabase();
  const session = await getCurrentSession();
  if (session.isGuest || !session.userId) {
    return {
      success: false,
      error: "Authentication required. Please log in or subscribe to review change requests.",
    };
  }

  const projectId = formData.get("projectId") as string;
  const requestId = formData.get("requestId") as string;
  const decision = formData.get("decision") as "Approved" | "Rejected";
  const reviewNote = (formData.get("reviewNote") as string)?.trim() || "";

  if (!projectId || !requestId || !decision) {
    return { success: false, error: "Project ID, Request ID, and Decision are required." };
  }

  const project = await Project.findById(projectId);
  if (!project) {
    return { success: false, error: "Project not found." };
  }

  // Enforce review permission
  if (!canReviewProjectChangeRequest(session.role, session.userId, project)) {
    return {
      success: false,
      error: "Only the designated Team Lead, Operations Manager, or Owner can approve project change requests.",
    };
  }

  const reqIndex = (project.changeRequests || []).findIndex(
    (r: any) => r._id?.toString() === requestId
  );

  if (reqIndex === -1) {
    return { success: false, error: "Change request item not found." };
  }

  const targetReq = project.changeRequests![reqIndex];
  targetReq.status = decision;
  targetReq.reviewedBy = session.userId as any;
  targetReq.reviewerName = session.name;
  targetReq.reviewNote = reviewNote;
  targetReq.reviewedAt = new Date();

  // If approved, automatically append to project agendas if it was an agenda/timeline change
  if (decision === "Approved") {
    project.agendas = project.agendas || [];
    project.agendas.push(`[Approved: ${targetReq.title}] ${targetReq.description || ""}`);
  }

  await project.save();
  revalidatePath("/projects");

  return {
    success: true,
    message: `Change request marked as ${decision}. ${decision === "Approved" ? "Agendas updated." : ""}`,
  };
}

/**
 * 7. Archive Member Action:
 * Owner, Manager, or Superuser archives an employee or team lead.
 * Manager cannot archive Owner or fellow Managers.
 */
export async function archiveMemberAction(formData: FormData): Promise<ActionResult> {
  await connectToDatabase();
  const session = await getCurrentSession();
  if (session.isGuest || !session.userId) {
    return {
      success: false,
      error: "Authentication required. Please log in or subscribe to archive members.",
    };
  }

  const userId = formData.get("userId") as string;
  if (!userId) {
    return { success: false, error: "Target user ID is required." };
  }

  const targetUser = await User.findById(userId);
  if (!targetUser) {
    return { success: false, error: "Target user not found." };
  }

  // Tenant Boundary Check: Ensure caller and target user belong to the same company (unless superuser)
  if (session.role !== "superuser" && session.companyId && targetUser.companyId) {
    if (session.companyId.toString() !== targetUser.companyId.toString()) {
      return { success: false, error: "Tenant boundary violation: Cannot archive members of other organizations." };
    }
  }

  // Enforce RBAC permission
  const check = canArchiveMember(session.role, targetUser.role);
  if (!check.allowed) {
    return {
      success: false,
      error: check.reason || "Unauthorized: You do not have permission to archive this member.",
    };
  }

  targetUser.status = UserStatus.Archived;
  targetUser.leftDate = new Date();
  targetUser.isActive = false;
  targetUser.remarks = `Archived by ${session.name} (${session.role}) on ${new Date().toLocaleDateString("en-US")}`;
  await targetUser.save();
  await syncTenantWrite("User", "update", targetUser._id.toString(), { status: UserStatus.Archived, isActive: false, leftDate: targetUser.leftDate, remarks: targetUser.remarks }, session.companyCode);

  // Remove member from active teams and projects
  await Team.updateMany({ members: targetUser._id }, { $pull: { members: targetUser._id } });
  await Project.updateMany({ memberIds: targetUser._id }, { $pull: { memberIds: targetUser._id } });

  revalidatePath("/teams");
  revalidatePath("/projects");
  revalidatePath("/diagrams");

  return {
    success: true,
    message: `Member ${targetUser.name} (${(targetUser.role || "MEMBER").toUpperCase()}) has been successfully archived and offboarded.`,
    data: { userId: targetUser._id.toString(), status: UserStatus.Archived },
  };
}

/**
 * 8. Restore Archived Member Action:
 * Owner, Manager, or Superuser restores an archived member back to active status.
 */
export async function restoreMemberAction(formData: FormData): Promise<ActionResult> {
  await connectToDatabase();
  const session = await getCurrentSession();
  if (session.isGuest || !session.userId) {
    return {
      success: false,
      error: "Authentication required. Please log in or subscribe to restore members.",
    };
  }

  const userId = formData.get("userId") as string;
  if (!userId) {
    return { success: false, error: "Target user ID is required." };
  }

  const targetUser = await User.findById(userId);
  if (!targetUser) {
    return { success: false, error: "Target user not found." };
  }

  if (session.role !== "superuser" && session.companyId && targetUser.companyId) {
    if (session.companyId.toString() !== targetUser.companyId.toString()) {
      return { success: false, error: "Tenant boundary violation." };
    }
  }

  const check = canArchiveMember(session.role, targetUser.role);
  if (!check.allowed) {
    return {
      success: false,
      error: check.reason || "Unauthorized to restore this member.",
    };
  }

  targetUser.status = UserStatus.Working;
  targetUser.leftDate = undefined;
  targetUser.isActive = true;
  targetUser.remarks = `Restored to active working roster by ${session.name} (${session.role}) on ${new Date().toLocaleDateString("en-US")}`;
  await targetUser.save();
  await syncTenantWrite("User", "update", targetUser._id.toString(), { status: UserStatus.Working, isActive: true, leftDate: null, remarks: targetUser.remarks }, session.companyCode);

  revalidatePath("/teams");
  revalidatePath("/projects");
  revalidatePath("/diagrams");

  return {
    success: true,
    message: `Member ${targetUser.name} has been restored to active working roster.`,
    data: { userId: targetUser._id.toString(), status: UserStatus.Working },
  };
}

/**
 * 9. Resign / Quit Member Action:
 * Employee or member submits their own resignation from the organization.
 */
export async function resignMemberAction(formData: FormData): Promise<ActionResult> {
  await connectToDatabase();
  const session = await getCurrentSession();
  if (session.isGuest || !session.userId) {
    return {
      success: false,
      error: "Authentication required. Please log in or subscribe.",
    };
  }

  const userId = (formData.get("userId") as string) || session.userId;
  if (!userId) {
    return { success: false, error: "User ID is required to process resignation." };
  }

  const isSelf = session.userId && session.userId.toString() === userId.toString();
  const canProcess = isSelf || ["owner", "superuser"].includes(session.role);

  if (!canProcess) {
    return {
      success: false,
      error: "You can only submit resignation for your own account.",
    };
  }

  const targetUser = await User.findById(userId);
  if (!targetUser) {
    return { success: false, error: "User record not found." };
  }

  targetUser.status = UserStatus.Resigned;
  targetUser.leftDate = new Date();
  targetUser.isActive = false;
  targetUser.remarks = `Voluntary resignation submitted by ${targetUser.name} on ${new Date().toLocaleDateString("en-US")}`;
  await targetUser.save();
  await syncTenantWrite("User", "update", targetUser._id.toString(), { status: UserStatus.Resigned, isActive: false, leftDate: targetUser.leftDate, remarks: targetUser.remarks }, session.companyCode);

  // Remove from active teams & projects
  await Team.updateMany({ members: targetUser._id }, { $pull: { members: targetUser._id } });
  await Project.updateMany({ memberIds: targetUser._id }, { $pull: { memberIds: targetUser._id } });

  revalidatePath("/teams");
  revalidatePath("/projects");
  revalidatePath("/diagrams");

  return {
    success: true,
    message: "Resignation recorded. Account successfully offboarded from company operations.",
    data: { userId: targetUser._id.toString(), status: UserStatus.Resigned, isSelf },
  };
}
