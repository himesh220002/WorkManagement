import mongoose, { Schema, Model } from "mongoose";

export interface IChatAttachmentDoc {
  _id: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  messageId?: mongoose.Types.ObjectId;
  s3Key: string;
  fileName: string;
  fileType: "image" | "pdf";
  mimeType: string;
  fileSize: number;
  originalSize?: number;
  isHdOriginal?: boolean;
  reductionPercent?: number;
  url: string;
  expiresAt: Date;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const chatAttachmentSchema = new Schema<IChatAttachmentDoc>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", index: true },
    messageId: { type: Schema.Types.ObjectId, ref: "ChatMessage", index: true },
    s3Key: { type: String, required: true, unique: true, index: true },
    fileName: { type: String, required: true },
    fileType: { type: String, enum: ["image", "pdf"], required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    originalSize: { type: Number },
    isHdOriginal: { type: Boolean, default: false },
    reductionPercent: { type: Number, default: 0 },
    url: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

chatAttachmentSchema.index({ expiresAt: 1, isDeleted: 1 });

export const ChatAttachment: Model<IChatAttachmentDoc> =
  mongoose.models.ChatAttachment ||
  mongoose.model<IChatAttachmentDoc>("ChatAttachment", chatAttachmentSchema);

export default ChatAttachment;
