import { UserRoleType, ROLE_HIERARCHY } from "@/models/enums";

export type RoleName = "superuser" | "owner" | "manager" | "teamlead" | "employee";

/**
 * Normalizes any role string or legacy alias into one of the 5 canonical roles.
 */
export function normalizeRole(role?: string | null): RoleName {
  if (!role) return "employee";
  const lower = role.toLowerCase().trim();
  if (lower === "superuser" || lower === "developer" || lower === "dev") return "superuser";
  if (lower === "owner" || lower === "admin") return "owner";
  if (lower === "manager") return "manager";
  if (lower === "teamlead" || lower === "tl" || lower === "lead") return "teamlead";
  return "employee";
}

/**
 * Checks if a caller has at least the minimum hierarchical rank.
 */
export function hasMinimumRole(callerRole: string | undefined, minRole: RoleName): boolean {
  const caller = normalizeRole(callerRole);
  const callerRank = ROLE_HIERARCHY[caller] || 20;
  const minRank = ROLE_HIERARCHY[minRole] || 20;
  return callerRank >= minRank;
}

/**
 * 1. Member Provisioning Rules:
 * - Superuser: can provision any role.
 * - Owner: can provision manager, teamlead, employee.
 * - Manager: can provision teamlead, employee with login & initial password.
 * - Team Lead & Employee: CANNOT provision any members.
 */
export function canProvisionMemberRole(
  callerRole: string | undefined,
  targetRole: string
): { allowed: boolean; reason?: string } {
  const caller = normalizeRole(callerRole);
  const target = normalizeRole(targetRole);

  if (caller === "superuser") {
    return { allowed: true };
  }

  if (caller === "owner") {
    if (target === "superuser") {
      return { allowed: false, reason: "Owner cannot provision developer superusers" };
    }
    return { allowed: true };
  }

  if (caller === "manager") {
    if (target === "owner" || target === "superuser" || target === "manager") {
      return {
        allowed: false,
        reason: "Manager can only create and provision Team Leads and Employees",
      };
    }
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: "Only Managers and Owners can register new company members with login credentials",
  };
}

/**
 * 2. Role / Tag Modification Rules:
 * - Superuser: free hand.
 * - Owner: can change tags of manager, teamlead, employee. Cannot touch superuser.
 * - Manager:
 *     - CANNOT change tags of Owner or Superuser.
 *     - CANNOT promote anyone to Owner or Superuser.
 *     - CAN change tags between Team Lead and Employee.
 * - Team Lead & Employee: CANNOT modify anyone's tag.
 */
export function canUpdateMemberRole(
  callerRole: string | undefined,
  targetCurrentRole: string | undefined,
  targetNewRole: string
): { allowed: boolean; reason?: string } {
  const caller = normalizeRole(callerRole);
  const current = normalizeRole(targetCurrentRole);
  const next = normalizeRole(targetNewRole);

  if (caller === "superuser") {
    return { allowed: true };
  }

  if (caller === "owner") {
    if (current === "superuser" || next === "superuser") {
      return { allowed: false, reason: "Owners cannot modify Superuser developers" };
    }
    return { allowed: true };
  }

  if (caller === "manager") {
    if (current === "owner" || current === "superuser") {
      return {
        allowed: false,
        reason: "Managers cannot alter the role or tags of the Company Owner or Developer",
      };
    }
    if (next === "owner" || next === "superuser" || next === "manager") {
      return {
        allowed: false,
        reason: "Managers cannot promote members to Owner, Manager, or Developer",
      };
    }
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: "Team Leads and Employees cannot change member roles or system tags",
  };
}

/**
 * 3. Project Management Rules:
 * - Superuser, Owner, Manager: Can assign which employees work on which projects and designate Team Leads.
 * - Team Lead: Project-centric; can view and modify everything in their assigned projects.
 * - Employee: Can view project settings, but CANNOT modify agendas/timelines directly.
 */
export function canAssignProjectStaff(callerRole: string | undefined): boolean {
  const caller = normalizeRole(callerRole);
  return ["superuser", "owner", "manager"].includes(caller);
}

export function canEditProjectAgendasAndTimelines(
  callerRole: string | undefined,
  callerUserId: string | undefined,
  project: { leadId?: any; ownerId?: any; memberIds?: any[] }
): { allowed: boolean; reason?: string } {
  const caller = normalizeRole(callerRole);

  // Superuser, Owner, and Manager have company-wide project authority
  if (["superuser", "owner", "manager"].includes(caller)) {
    return { allowed: true };
  }

  // Team Lead: Project-centric permissions for assigned projects
  if (caller === "teamlead") {
    const pLeadId = project.leadId?.toString ? project.leadId.toString() : String(project.leadId || "");
    const pOwnerId = project.ownerId?.toString ? project.ownerId.toString() : String(project.ownerId || "");
    const currentUid = String(callerUserId || "");

    const isAssignedLead = currentUid && (pLeadId === currentUid || pOwnerId === currentUid);
    if (isAssignedLead) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: "Team Leads can only edit agendas and timelines for their assigned projects",
    };
  }

  // Employee: Read-only on agendas & timelines; can submit change requests
  return {
    allowed: false,
    reason:
      "Employees can view agendas and timelines, but critical project changes require Team Lead approval",
  };
}

/**
 * 4. Task Management Rules:
 * - Employees, Team Leads, Managers, Owners, Superusers:
 *   Full empowerment to create, update, check off, and delete tasks.
 */
export function canManageTasks(): boolean {
  return true;
}

/**
 * 5. Project Change Request Rules:
 * - Employees can submit change requests.
 * - Team Leads (for assigned projects), Managers, Owners, and Superusers can approve/reject.
 */
export function canReviewProjectChangeRequest(
  callerRole: string | undefined,
  callerUserId: string | undefined,
  project: { leadId?: any; ownerId?: any }
): boolean {
  const caller = normalizeRole(callerRole);
  if (["superuser", "owner", "manager"].includes(caller)) return true;

  if (caller === "teamlead") {
    const pLeadId = project.leadId?.toString ? project.leadId.toString() : String(project.leadId || "");
    const pOwnerId = project.ownerId?.toString ? project.ownerId.toString() : String(project.ownerId || "");
    const currentUid = String(callerUserId || "");
    return Boolean(currentUid && (pLeadId === currentUid || pOwnerId === currentUid));
  }

  return false;
}

/**
 * 6. Member Archiving & Offboarding Rules:
 * - Superuser: can archive anyone.
 * - Owner: can archive manager, teamlead, employee. Cannot archive superusers.
 * - Manager: can archive teamlead, employee. Cannot archive owner, fellow managers, or superusers.
 * - Team Lead & Employee: CANNOT archive anyone.
 */
export function canArchiveMember(
  callerRole: string | undefined,
  targetCurrentRole: string | undefined
): { allowed: boolean; reason?: string } {
  const caller = normalizeRole(callerRole);
  const target = normalizeRole(targetCurrentRole);

  if (caller === "superuser") {
    return { allowed: true };
  }

  if (caller === "owner") {
    if (target === "superuser") {
      return { allowed: false, reason: "Owners cannot archive Superuser developer accounts." };
    }
    if (target === "owner") {
      return { allowed: false, reason: "Cannot archive organization owners." };
    }
    return { allowed: true };
  }

  if (caller === "manager") {
    if (target === "owner" || target === "superuser") {
      return { allowed: false, reason: "Managers cannot archive organization owners or developer accounts." };
    }
    if (target === "manager") {
      return { allowed: false, reason: "Managers cannot archive other managers." };
    }
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: "Only Owners, Managers, and Superusers have permission to archive members.",
  };
}

/**
 * 7. Member Resignation Rules:
 * - Any user can submit their own voluntary resignation.
 * - Superusers and Owners can process an administrative resignation.
 */
export function canResignMember(
  callerUserId: string | undefined,
  targetUserId: string | undefined,
  callerRole?: string | undefined
): { allowed: boolean; reason?: string } {
  if (callerUserId && targetUserId && callerUserId.toString() === targetUserId.toString()) {
    return { allowed: true };
  }
  const role = normalizeRole(callerRole);
  if (role === "owner" || role === "superuser") {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: "Resignation can only be submitted by the member themselves.",
  };
}

