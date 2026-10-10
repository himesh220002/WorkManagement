import mongoose, { Schema, Model } from "mongoose";

export interface IChatMention {
  userId: string;
  name: string;
  email?: string;
}

export interface IChatReaction {
  emoji: string;
  userId: string;
  userName: string;
}

export interface IChatAttachment {
  name: string;
  url: string;
  size?: number;
  originalSize?: number;
  type?: string; // "image" | "pdf" | "file"
  mimeType?: string;
  s3Key?: string;
  isHdOriginal?: boolean;
  reductionPercent?: number;
  expiresAt?: Date | string;
  isExpired?: boolean;
}

export type ChatScopeType = "global" | "team" | "group" | "direct";

export interface IChatMessage {
  _id: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  senderId: string;
  senderName: string;
  senderEmail?: string;
  senderRole?: string;
  senderAvatar?: string;
  content: string;
  scope: ChatScopeType;
  targetScopeId: string;
  targetScopeName: string;
  mentionedUsers: IChatMention[];
  reactions: IChatReaction[];
  attachments?: IChatAttachment[];
  isEdited?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", index: true, required: true },
    senderId: { type: String, required: true, index: true },
    senderName: { type: String, required: true },
    senderEmail: { type: String, default: "" },
    senderRole: { type: String, default: "Member" },
    senderAvatar: { type: String, default: "" },
    content: { type: String, required: true },
    scope: {
      type: String,
      enum: ["global", "team", "group", "direct"],
      default: "global",
      index: true,
    },
    targetScopeId: { type: String, default: "global", index: true },
    targetScopeName: { type: String, default: "All Company" },
    mentionedUsers: [
      {
        userId: { type: String, required: true },
        name: { type: String, required: true },
        email: { type: String, default: "" },
      },
    ],
    reactions: [
      {
        emoji: { type: String, required: true },
        userId: { type: String, required: true },
        userName: { type: String, required: true },
      },
    ],
    attachments: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        size: { type: Number, default: 0 },
        originalSize: { type: Number },
        type: { type: String, default: "file" },
        mimeType: { type: String, default: "" },
        s3Key: { type: String, default: "" },
        isHdOriginal: { type: Boolean, default: false },
        reductionPercent: { type: Number, default: 0 },
        expiresAt: { type: Date },
        isExpired: { type: Boolean, default: false },
      },
    ],
    isEdited: { type: Boolean, default: false },
  },
  { timestamps: true }
);

chatMessageSchema.index({ companyId: 1, scope: 1, targetScopeId: 1, createdAt: -1 });
chatMessageSchema.index({ "attachments.expiresAt": 1 });

export const ChatMessage: Model<IChatMessage> =
  mongoose.models.ChatMessage || mongoose.model<IChatMessage>("ChatMessage", chatMessageSchema);

export default ChatMessage;
