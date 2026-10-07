import { DocumentCategory } from "@/models/types";

export interface CategoryDocumentConfig {
  category: DocumentCategory;
  label: string;
  description: string;
  maxSizeBytes: number;
  maxSizeMB: number;
  allowedExtensions: string[];
  allowedMimeTypes: string[];
  subtypes: string[];
}

export const DOCUMENT_CATEGORY_CONFIGS: Record<DocumentCategory, CategoryDocumentConfig> = {
  EMPLOYEE: {
    category: "EMPLOYEE",
    label: "Employee & Onboarding",
    description: "Personal documents, resume/CV, government ID proofs, and certifications.",
    maxSizeMB: 5,
    maxSizeBytes: 5 * 1024 * 1024, // 5 MB
    allowedExtensions: [".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx"],
    allowedMimeTypes: [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    subtypes: [
      "Resume / Curriculum Vitae",
      "Government Identity Proof (Passport / ID Card)",
      "Certificates & Educational Credentials",
      "Onboarding Package & Offer Letter",
    ],
  },
  PROJECT: {
    category: "PROJECT",
    label: "Project & Deliverables",
    description: "Roadmaps, architecture specs, sprint plans, technical diagrams, and task deliverables.",
    maxSizeMB: 25,
    maxSizeBytes: 25 * 1024 * 1024, // 25 MB
    allowedExtensions: [".pdf", ".png", ".jpg", ".jpeg", ".zip", ".docx", ".xlsx", ".pptx", ".md", ".txt"],
    allowedMimeTypes: [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "application/zip",
      "application/x-zip-compressed",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/markdown",
      "text/plain",
    ],
    subtypes: [
      "Project Presentation & Pitch Deck",
      "Architecture & Technical Specification",
      "Project Roadmap & Scope Plan",
      "Sprint Deliverable / Task Asset Archive",
      "Team Roster & Allocation Document",
      "Engineering Design Document (EDD)",
      "Quality Assurance & Test Plan",
    ],
  },
  SALES: {
    category: "SALES",
    label: "Sales & Client Pipeline",
    description: "Client proposals, sales funnel decks, revenue contracts, and quarterly performance summaries.",
    maxSizeMB: 15,
    maxSizeBytes: 15 * 1024 * 1024, // 15 MB
    allowedExtensions: [".pdf", ".docx", ".pptx", ".xlsx", ".csv"],
    allowedMimeTypes: [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ],
    subtypes: [
      "Client Proposal & Quotation",
      "Sales Funnel & Pitch Deck",
      "Quarterly Sales Performance Report",
      "Client Service Agreement & Contract",
    ],
  },
  SALARY_FINANCE: {
    category: "SALARY_FINANCE",
    label: "Salary, Payroll & Finance",
    description: "Salary distribution sheets, employee pay stubs, cashflow statements, and expense receipts.",
    maxSizeMB: 10,
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
    allowedExtensions: [".pdf", ".xlsx", ".csv", ".png", ".jpg", ".jpeg"],
    allowedMimeTypes: [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
      "image/png",
      "image/jpeg",
    ],
    subtypes: [
      "Monthly Salary Slip (Employee-Specific)",
      "Organization Payroll Distribution Sheet",
      "Cash Inflow / Outflow Balance Sheet",
      "Expense Reimbursement Claim & Receipt",
    ],
  },
};

/**
 * Validates file size, extension, and mime-type against category restrictions
 */
export function validateDocumentFile(
  category: DocumentCategory,
  fileSize: number,
  fileName: string,
  mimeType?: string
): { valid: boolean; error?: string } {
  const config = DOCUMENT_CATEGORY_CONFIGS[category];
  if (!config) {
    return { valid: false, error: `Invalid document category: ${category}` };
  }

  // 1. Check file size
  if (fileSize > config.maxSizeBytes) {
    const sizeInMB = (fileSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeInMB} MB) exceeds maximum allowed limit of ${config.maxSizeMB} MB for ${config.label}.`,
    };
  }

  // 2. Check file extension
  const ext = "." + fileName.split(".").pop()?.toLowerCase();
  const hasValidExt = config.allowedExtensions.includes(ext);

  // 3. Check MIME type (if provided)
  const hasValidMime =
    !mimeType ||
    config.allowedMimeTypes.includes(mimeType) ||
    mimeType === "application/octet-stream"; // fallback browser MIME

  if (!hasValidExt && !hasValidMime) {
    return {
      valid: false,
      error: `File format '${ext}' is not permitted for ${config.label}. Allowed: ${config.allowedExtensions.join(", ")}`,
    };
  }

  return { valid: true };
}
