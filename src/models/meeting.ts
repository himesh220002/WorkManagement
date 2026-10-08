import mongoose, { Schema, Model } from "mongoose";

export interface IAttendee {
  userId?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  role?: string;
  attendanceStatus?: "invited" | "confirmed" | "attended" | "declined";
}

export interface IActionItem {
  text: string;
  assigneeName?: string;
  completed: boolean;
}

export interface IMeeting {
  _id: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  projectId?: mongoose.Types.ObjectId;
  clientAccountId?: mongoose.Types.ObjectId;
  clientAccountName?: string;
  organizerName: string;
  organizerEmail?: string;
  scheduledAt: Date;
  durationMinutes: number;
  platform: "google_meet" | "zoom" | "slack" | "discord" | "in_person";
  meetingLink: string;
  // Connectivity details
  discordChannelUrl?: string;
  discordChannelName?: string;
  slackChannelName?: string;
  slackWebhookUrl?: string;
  // Attendees
  attendees: IAttendee[];
  // Auto-scheduler / recurring
  isRecurring?: boolean;
  recurrenceCadence?: "none" | "daily" | "weekly" | "biweekly" | "monthly";
  recurrenceDayOfWeek?: string;
  // Status & Telemetry
  status: "Scheduled" | "In Progress" | "Completed" | "Cancelled";
  // Records & Transcripts
  transcript?: string;
  transcriptPdfDataUrl?: string;
  keyTakeaways?: string[];
  actionItems?: IActionItem[];
  recordingUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const meetingSchema = new Schema<IMeeting>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", index: true, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
    clientAccountId: { type: Schema.Types.ObjectId, ref: "ClientAccount", index: true },
    clientAccountName: { type: String, default: "" },
    organizerName: { type: String, required: true, default: "Operations Lead" },
    organizerEmail: { type: String, default: "" },
    scheduledAt: { type: Date, required: true, default: Date.now },
    durationMinutes: { type: Number, default: 45 },
    platform: {
      type: String,
      enum: ["google_meet", "zoom", "slack", "discord", "in_person"],
      default: "google_meet",
    },
    meetingLink: { type: String, required: true },
    discordChannelUrl: { type: String, default: "" },
    discordChannelName: { type: String, default: "" },
    slackChannelName: { type: String, default: "" },
    slackWebhookUrl: { type: String, default: "" },
    attendees: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        name: { type: String, required: true },
        email: { type: String, required: true },
        role: { type: String, default: "Member" },
        attendanceStatus: {
          type: String,
          enum: ["invited", "confirmed", "attended", "declined"],
          default: "invited",
        },
      },
    ],
    isRecurring: { type: Boolean, default: false },
    recurrenceCadence: {
      type: String,
      enum: ["none", "daily", "weekly", "biweekly", "monthly"],
      default: "none",
    },
    recurrenceDayOfWeek: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Scheduled", "In Progress", "Completed", "Cancelled"],
      default: "Scheduled",
      index: true,
    },
    transcript: { type: String, default: "" },
    transcriptPdfDataUrl: { type: String, default: "" },
    keyTakeaways: [{ type: String }],
    actionItems: [
      {
        text: { type: String, required: true },
        assigneeName: { type: String, default: "" },
        completed: { type: Boolean, default: false },
      },
    ],
    recordingUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Meeting: Model<IMeeting> =
  mongoose.models.Meeting || mongoose.model<IMeeting>("Meeting", meetingSchema);
export default Meeting;
