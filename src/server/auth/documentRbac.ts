import { normalizeRole, RoleName } from "./rbac";
import { DocumentCategory } from "@/models/types";

export interface DocumentRbacContext {
  userId?: string;
  role: RoleName;
  companyId?: string;
}

export interface DocumentAccessTarget {
  category: DocumentCategory;
  entityId?: string | null;
  uploadedBy?: string;
  assignedProjectMemberIds?: string[];
}

/**
 * Checks if the caller has permission to view a document in the given category
 */
export function canViewDocument(
  session: DocumentRbacContext,
  target: DocumentAccessTarget
): { allowed: boolean; reason?: string } {
  const role = normalizeRole(session.role);

  // Superuser and Owner always have full read access
  if (role === "superuser" || role === "owner") {
    return { allowed: true };
  }

  const { category, entityId, uploadedBy, assignedProjectMemberIds } = target;
  const currentUid = String(session.userId || "");

  switch (category) {
    case "EMPLOYEE": {
      // Employee can view own onboarding/resume docs
      if (role === "employee") {
        if (entityId === currentUid || uploadedBy === currentUid) {
          return { allowed: true };
        }
        return { allowed: false, reason: "Employees can only access their own personnel documents." };
      }
      // Manager has read access to team staff
      if (role === "manager" || role === "teamlead") {
        return { allowed: true };
      }
      return { allowed: false, reason: "Unauthorized to view employee documents." };
    }

    case "PROJECT": {
      if (role === "manager" || role === "teamlead") {
        return { allowed: true };
      }
      if (role === "employee") {
        if (!assignedProjectMemberIds || assignedProjectMemberIds.includes(currentUid)) {
          return { allowed: true };
        }
        return { allowed: false, reason: "Employees can only view documents for assigned projects." };
      }
      return { allowed: false, reason: "Unauthorized to view project assets." };
    }

    case "SALES": {
      if (role === "manager") {
        return { allowed: true };
      }
      if (role === "employee") {
        return { allowed: false, reason: "Confidential sales decks and contracts are restricted from general employees." };
      }
      return { allowed: false, reason: "Unauthorized to view sales documents." };
    }

    case "SALARY_FINANCE": {
      // Managers strictly have NO access to sensitive financial balance sheets or peer salaries
      if (role === "manager" || role === "teamlead") {
        return { allowed: false, reason: "Salary and financial records are restricted from management roles." };
      }
      // Employees can ONLY view their own salary slips
      if (role === "employee") {
        if (entityId === currentUid) {
          return { allowed: true };
        }
        return { allowed: false, reason: "Employees may only access their personal salary slips." };
      }
      return { allowed: false, reason: "Unauthorized to view financial records." };
    }
  }
}

/**
 * Checks if the caller has permission to upload a document into the given category
 */
export function canUploadDocument(
  session: DocumentRbacContext,
  category: DocumentCategory,
  entityId?: string | null
): { allowed: boolean; reason?: string } {
  const role = normalizeRole(session.role);

  if (role === "superuser" || role === "owner") {
    return { allowed: true };
  }

  const currentUid = String(session.userId || "");

  switch (category) {
    case "EMPLOYEE": {
      if (role === "employee") {
        // Can upload own resume, certifications, or onboarding docs
        if (entityId === currentUid || !entityId) {
          return { allowed: true };
        }
        return { allowed: false, reason: "Employees can only upload onboarding documents for their own profile." };
      }
      if (role === "manager") {
        return { allowed: true };
      }
      return { allowed: false, reason: "Unauthorized to upload personnel documents." };
    }

    case "PROJECT": {
      if (role === "manager" || role === "teamlead" || role === "employee") {
        return { allowed: true };
      }
      return { allowed: false, reason: "Unauthorized to upload project deliverables." };
    }

    case "SALES": {
      if (role === "manager") {
        return { allowed: true };
      }
      return { allowed: false, reason: "Sales document upload restricted to sales management and owners." };
    }

    case "SALARY_FINANCE": {
      // Only Owner and Superuser can upload payroll and balance sheets
      return { allowed: false, reason: "Only Organization Owners can upload salary sheets and financial statements." };
    }
  }
}
