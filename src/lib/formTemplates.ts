import { IFormQuestion, FormQuestionType, TaskPropertyField } from "@/models/form";

export interface FormTemplateDefinition {
  id: "project-intake" | "feedback" | "order-form" | "job-application" | "it-requests" | "scratch";
  name: string;
  subtitle: string;
  description: string;
  themeColor: string;
  badgeBg: string;
  badgeBorder: string;
  iconName: "Layers" | "MessageSquareQuote" | "ShoppingBag" | "Briefcase" | "Laptop" | "Plus";
  questions: IFormQuestion[];
}

export const FORM_TEMPLATES: FormTemplateDefinition[] = [
  {
    id: "feedback",
    name: "Feedback Form",
    subtitle: "Survey and collect feedback",
    description: "Collect structured feedback, Net Promoter Score (NPS), and client satisfaction ratings to continuously improve your team's deliverables.",
    themeColor: "#10B981",
    badgeBg: "rgba(16, 185, 129, 0.15)",
    badgeBorder: "rgba(16, 185, 129, 0.35)",
    iconName: "MessageSquareQuote",
    questions: [
      {
        id: "q_fb_1",
        type: "single_select",
        title: "How would you rate your overall experience?",
        description: "Choose the rating that best reflects your recent collaboration or product usage.",
        required: true,
        options: ["⭐⭐⭐⭐⭐ Outstanding", "⭐⭐⭐⭐ Very Good", "⭐⭐⭐ Satisfactory", "⭐⭐ Needs Improvement", "⭐ Poor"],
      },
      {
        id: "q_fb_2",
        type: "long_text",
        title: "What did you like most about our service or deliverables?",
        placeholder: "Highlights, strengths, helpful team interactions...",
        required: false,
      },
      {
        id: "q_fb_3",
        type: "long_text",
        title: "What areas can we improve or what features would you like to see?",
        placeholder: "Suggestions, bottlenecks encountered, desired improvements...",
        required: false,
      },
      {
        id: "q_fb_4",
        type: "contact_info",
        contactType: "email",
        title: "Your Email Address (optional for follow-up)",
        placeholder: "alex@company.com",
        required: false,
      },
    ],
  },
  {
    id: "project-intake",
    name: "Project Intake",
    subtitle: "Streamline new project requests",
    description: "Let's get your project started! 🥳 Use this Form to initiate your project and ensure that it aligns with strategic company initiatives.",
    themeColor: "#E11D48",
    badgeBg: "rgba(225, 29, 72, 0.15)",
    badgeBorder: "rgba(225, 29, 72, 0.35)",
    iconName: "Layers",
    questions: [
      {
        id: "q_pi_1",
        type: "short_text",
        taskProperty: "task_name",
        title: "Project Name *",
        description: "Tip: use a simple but recognizable and descriptive name for the project.",
        placeholder: "Example: Data Optimization Project",
        required: true,
      },
      {
        id: "q_pi_2",
        type: "information_block",
        title: "Information Block",
        layoutContent:
          "Give as many details as you can, so our project committee can ensure that resources are effectively allocated. This helps your project be completed on time and within budget.",
      },
      {
        id: "q_pi_3",
        type: "long_text",
        taskProperty: "description",
        title: "Details about the project *",
        description: "Please include links to any meeting notes, Docs, tasks, or information that will be helpful.",
        placeholder: "Project goals, scope, task & Doc links",
        required: true,
      },
      {
        id: "q_pi_4",
        type: "task_property",
        taskProperty: "priority",
        title: "What is the priority of this project? *",
        description: "Consult with your executive leader for prioritization.",
        options: ["Urgent", "High", "Normal", "Low"],
        required: true,
      },
      {
        id: "q_pi_5",
        type: "uploads",
        title: "Attachments",
        description: "Add any attachments with relevant information and context.",
        placeholder: "Drop your files here to upload",
        required: false,
      },
    ],
  },
  {
    id: "order-form",
    name: "Order Form",
    subtitle: "Capture and process client orders",
    description: "Streamline customer and corporate purchase requests, workspace license scaling, and contract provisioning.",
    themeColor: "#8B5CF6",
    badgeBg: "rgba(139, 92, 246, 0.15)",
    badgeBorder: "rgba(139, 92, 246, 0.35)",
    iconName: "ShoppingBag",
    questions: [
      {
        id: "q_ord_1",
        type: "short_text",
        title: "Client / Organization Name *",
        placeholder: "Acme Corp / Tech Industries",
        required: true,
      },
      {
        id: "q_ord_2",
        type: "contact_info",
        contactType: "email",
        title: "Billing Contact Email *",
        placeholder: "billing@acme.com",
        required: true,
      },
      {
        id: "q_ord_3",
        type: "single_select",
        title: "Subscription Tier / Product Package *",
        description: "Select the license tier for provisioning.",
        options: ["Enterprise Tiered Monthly ($5/mo base)", "Enterprise Quarterly (Save 7%)", "Enterprise Annual (2 Months Free)", "Custom Dedicated Dedicated Instance"],
        required: true,
      },
      {
        id: "q_ord_4",
        type: "number",
        title: "Number of Workspace Seats Required *",
        placeholder: "10",
        required: true,
      },
      {
        id: "q_ord_5",
        type: "date",
        title: "Requested Go-Live / Delivery Date",
        required: false,
      },
      {
        id: "q_ord_6",
        type: "uploads",
        title: "Purchase Order (PO) or Agreement PDF",
        description: "Attach signed vendor agreements or billing purchase orders.",
        required: false,
      },
      {
        id: "q_ord_7",
        type: "signature",
        title: "Authorized Representative Signature *",
        description: "Draw your signature below to authorize purchase processing.",
        required: true,
      },
    ],
  },
  {
    id: "job-application",
    name: "Job Application",
    subtitle: "Accept and review applications for open roles",
    description: "Standardize incoming candidate submissions for engineering, product design, and executive roles.",
    themeColor: "#F59E0B",
    badgeBg: "rgba(245, 158, 11, 0.15)",
    badgeBorder: "rgba(245, 158, 11, 0.35)",
    iconName: "Briefcase",
    questions: [
      {
        id: "q_job_1",
        type: "short_text",
        title: "Candidate Full Name *",
        placeholder: "Elena Rostova",
        required: true,
      },
      {
        id: "q_job_2",
        type: "contact_info",
        contactType: "email",
        title: "Email Address *",
        placeholder: "elena@talentpool.io",
        required: true,
      },
      {
        id: "q_job_3",
        type: "contact_info",
        contactType: "phone",
        title: "Phone Number",
        placeholder: "+1 (555) 019-2834",
        required: false,
      },
      {
        id: "q_job_4",
        type: "single_select",
        title: "Role Applied For *",
        options: [
          "Senior Frontend Engineer (React/Next.js)",
          "Backend Systems Engineer (Node/MongoDB)",
          "Fullstack Lead Architect",
          "Product Designer (UI/UX / Design System)",
          "DevOps & Site Reliability Engineer (AWS/S3)",
          "Engineering Manager",
        ],
        required: true,
      },
      {
        id: "q_job_5",
        type: "uploads",
        title: "Resume / CV (PDF or DOCX) *",
        description: "Upload your most recent curriculum vitae.",
        required: true,
      },
      {
        id: "q_job_6",
        type: "short_text",
        title: "Portfolio, GitHub, or LinkedIn URL",
        placeholder: "https://github.com/developer",
        required: false,
      },
      {
        id: "q_job_7",
        type: "long_text",
        title: "Why do you want to join our engineering and product team?",
        placeholder: "Tell us about your passions, impact goals, and recent technical highlights...",
        required: false,
      },
    ],
  },
  {
    id: "it-requests",
    name: "IT Requests",
    subtitle: "Triage and prioritize IT service requests",
    description: "Manage internal hardware, software access, VPN connectivity, and corporate credential requests.",
    themeColor: "#3B82F6",
    badgeBg: "rgba(59, 130, 246, 0.15)",
    badgeBorder: "rgba(59, 130, 246, 0.35)",
    iconName: "Laptop",
    questions: [
      {
        id: "q_it_1",
        type: "short_text",
        taskProperty: "task_name",
        title: "Issue Summary / Subject *",
        placeholder: "e.g., VPN Access Request or S3 Bucket Permission Issue",
        required: true,
      },
      {
        id: "q_it_2",
        type: "task_property",
        taskProperty: "priority",
        title: "Urgency / Severity Level *",
        options: ["P1 - System Outage / Work Halted", "P2 - High Priority / Major Blocker", "P3 - Moderate / Workaround Available", "P4 - Low / General Question"],
        required: true,
      },
      {
        id: "q_it_3",
        type: "single_select",
        title: "Department *",
        options: ["Engineering", "Design", "Sales & Marketing", "Finance & Legal", "People Ops / HR"],
        required: true,
      },
      {
        id: "q_it_4",
        type: "long_text",
        taskProperty: "description",
        title: "Detailed Description of the Issue *",
        placeholder: "Please describe what happened, steps to reproduce, or exact hardware requested...",
        required: true,
      },
      {
        id: "q_it_5",
        type: "uploads",
        title: "Screenshots, Error Logs, or Diagnostics",
        description: "Attach terminal logs or browser error screenshots.",
        required: false,
      },
    ],
  },
  {
    id: "scratch",
    name: "Start from scratch",
    subtitle: "Create a custom Form to fit your exact needs",
    description: "Build a brand new custom form completely from the ground up with our drag-and-drop questions builder.",
    themeColor: "#64748B",
    badgeBg: "rgba(100, 116, 139, 0.15)",
    badgeBorder: "rgba(100, 116, 139, 0.35)",
    iconName: "Plus",
    questions: [
      {
        id: "q_sc_1",
        type: "short_text",
        title: "Untitled Question",
        placeholder: "Type your answer here...",
        required: false,
      },
    ],
  },
];

/**
 * Dropdown Menu Definitions matching the user's ClickUp-styled snippet:
 * Categories: Questions type & Layout
 */
export interface QuestionTypeMenuItem {
  type: FormQuestionType;
  title: string;
  category: "Questions type" | "Layout";
  icon: string;
  hasSubmenu?: boolean;
  subItems?: {
    title: string;
    taskProperty?: TaskPropertyField;
    contactType?: "email" | "phone" | "website" | "all";
  }[];
  defaultData: Partial<IFormQuestion>;
}

export const QUESTION_TYPE_MENU_ITEMS: QuestionTypeMenuItem[] = [
  // --- Category: Questions type ---
  {
    type: "task_property",
    title: "Task property",
    category: "Questions type",
    icon: "ClickUpLogo",
    hasSubmenu: true,
    subItems: [
      { title: "Task Name", taskProperty: "task_name" },
      { title: "Description", taskProperty: "description" },
      { title: "Priority", taskProperty: "priority" },
      { title: "Due Date", taskProperty: "due_date" },
      { title: "Assignee", taskProperty: "assignee" },
      { title: "Status", taskProperty: "status" },
      { title: "Tags", taskProperty: "tags" },
    ],
    defaultData: {
      type: "task_property",
      title: "Task Property",
      taskProperty: "task_name",
      placeholder: "Enter task value...",
    },
  },
  {
    type: "short_text",
    title: "Short text",
    category: "Questions type",
    icon: "Type",
    hasSubmenu: true,
    defaultData: {
      type: "short_text",
      title: "Short Text Question",
      placeholder: "Your answer here...",
    },
  },
  {
    type: "long_text",
    title: "Long text",
    category: "Questions type",
    icon: "AlignLeft",
    hasSubmenu: true,
    defaultData: {
      type: "long_text",
      title: "Detailed Response",
      placeholder: "Type longer answer here...",
    },
  },
  {
    type: "date",
    title: "Dates",
    category: "Questions type",
    icon: "Calendar",
    hasSubmenu: true,
    defaultData: {
      type: "date",
      title: "Target Date",
      description: "Pick a date from the calendar",
    },
  },
  {
    type: "single_select",
    title: "Single-select",
    category: "Questions type",
    icon: "ChevronDownSquare",
    hasSubmenu: true,
    defaultData: {
      type: "single_select",
      title: "Choose an Option",
      options: ["Option 1", "Option 2", "Option 3"],
    },
  },
  {
    type: "multi_select",
    title: "Multi-select",
    category: "Questions type",
    icon: "Tag",
    hasSubmenu: true,
    defaultData: {
      type: "multi_select",
      title: "Select All Applicable",
      options: ["Choice A", "Choice B", "Choice C"],
    },
  },
  {
    type: "contact_info",
    title: "Contact info",
    category: "Questions type",
    icon: "Phone",
    hasSubmenu: true,
    subItems: [
      { title: "Email Address", contactType: "email" },
      { title: "Phone Number", contactType: "phone" },
      { title: "Website URL", contactType: "website" },
      { title: "Full Contact Card", contactType: "all" },
    ],
    defaultData: {
      type: "contact_info",
      contactType: "email",
      title: "Contact Info",
      placeholder: "name@company.com",
    },
  },
  {
    type: "people",
    title: "People",
    category: "Questions type",
    icon: "Users",
    hasSubmenu: true,
    defaultData: {
      type: "people",
      title: "Responsible Person / Team Member",
      description: "Select member from your organization workspace",
    },
  },
  {
    type: "uploads",
    title: "Uploads",
    category: "Questions type",
    icon: "Paperclip",
    hasSubmenu: true,
    defaultData: {
      type: "uploads",
      title: "Attachments",
      description: "Drop your files here to upload",
      placeholder: "Drop your files here to upload",
    },
  },
  {
    type: "number",
    title: "Number",
    category: "Questions type",
    icon: "Hash",
    hasSubmenu: true,
    defaultData: {
      type: "number",
      title: "Numeric Quantity / Value",
      placeholder: "0",
    },
  },
  {
    type: "signature",
    title: "Signature",
    category: "Questions type",
    icon: "PenTool",
    hasSubmenu: true,
    defaultData: {
      type: "signature",
      title: "Digital Signature",
      description: "Sign using your mouse, trackpad, or finger",
    },
  },

  // --- Category: Layout ---
  {
    type: "information_block",
    title: "Information Block",
    category: "Layout",
    icon: "Info",
    hasSubmenu: false,
    defaultData: {
      type: "information_block",
      title: "Notice & Guidelines",
      layoutContent: "Please review the information above before submitting. Ensure all required fields are accurately filled out.",
    },
  },
];
