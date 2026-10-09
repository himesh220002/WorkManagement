import mongoose, { Schema, Model } from "mongoose";

export type FormQuestionType =
  | "task_property"
  | "short_text"
  | "long_text"
  | "date"
  | "single_select"
  | "multi_select"
  | "contact_info"
  | "people"
  | "uploads"
  | "number"
  | "signature"
  | "information_block";

export type TaskPropertyField =
  | "task_name"
  | "description"
  | "priority"
  | "due_date"
  | "assignee"
  | "status"
  | "tags";

export interface IFormQuestion {
  id: string;
  type: FormQuestionType;
  title: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  taskProperty?: TaskPropertyField;
  contactType?: "email" | "phone" | "website" | "all";
  layoutContent?: string;
}

export interface IFormSubmission {
  id: string;
  submittedAt: Date;
  respondentEmail?: string;
  respondentName?: string;
  answers: Record<string, any>;
  createdTaskId?: string;
}

export interface IForm {
  _id: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  templateId?:
    | "project-intake"
    | "feedback"
    | "order-form"
    | "job-application"
    | "it-requests"
    | "scratch";
  themeColor?: string;
  isPublished: boolean;
  submitButtonText?: string;
  createTaskOnSubmission?: boolean;
  targetProjectId?: string;
  questions: IFormQuestion[];
  submissions: IFormSubmission[];
  authorName?: string;
  authorId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const formQuestionSchema = new Schema<IFormQuestion>(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "task_property",
        "short_text",
        "long_text",
        "date",
        "single_select",
        "multi_select",
        "contact_info",
        "people",
        "uploads",
        "number",
        "signature",
        "information_block",
      ],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    placeholder: { type: String, default: "" },
    required: { type: Boolean, default: false },
    options: { type: [String], default: [] },
    taskProperty: {
      type: String,
      enum: ["task_name", "description", "priority", "due_date", "assignee", "status", "tags"],
      default: undefined,
    },
    contactType: {
      type: String,
      enum: ["email", "phone", "website", "all"],
      default: undefined,
    },
    layoutContent: { type: String, default: "" },
  },
  { _id: false }
);

const formSubmissionSchema = new Schema<IFormSubmission>(
  {
    id: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now },
    respondentEmail: { type: String, default: "" },
    respondentName: { type: String, default: "" },
    answers: { type: Schema.Types.Mixed, default: {} },
    createdTaskId: { type: String, default: "" },
  },
  { _id: false }
);

const formSchema = new Schema<IForm>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", index: true, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    templateId: {
      type: String,
      enum: ["project-intake", "feedback", "order-form", "job-application", "it-requests", "scratch"],
      default: "scratch",
    },
    themeColor: { type: String, default: "#0078D4" },
    isPublished: { type: Boolean, default: true, index: true },
    submitButtonText: { type: String, default: "Submit" },
    createTaskOnSubmission: { type: Boolean, default: true },
    targetProjectId: { type: String, default: "" },
    questions: { type: [formQuestionSchema], default: [] },
    submissions: { type: [formSubmissionSchema], default: [] },
    authorName: { type: String, default: "Admin" },
    authorId: { type: String, default: "" },
  },
  { timestamps: true }
);

formSchema.index({ companyId: 1, createdAt: -1 });

export const Form: Model<IForm> =
  mongoose.models.Form || mongoose.model<IForm>("Form", formSchema);

export default Form;
