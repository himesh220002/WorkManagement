import mongoose, { Schema, Model } from "mongoose";

export interface IChatChannelMember {
  userId: string;
  name: string;
  email: string;
  role?: string;
  department?: string;
  avatar?: string;
}

export type ChatChannelType = "team" | "group" | "direct";

export interface IChatChannel {
  _id: mongoose.Types.ObjectId;
  companyId?: mongoose.Types.ObjectId;
  channelId: string;
  name: string;
  type: ChatChannelType;
  description?: string;
  createdBy: string;
  creatorName: string;
  memberIds: string[];
  memberEmails: string[];
  members: IChatChannelMember[];
  isDefault?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const chatChannelMemberSchema = new Schema<IChatChannelMember>(
  {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, default: "" },
    role: { type: String, default: "Member" },
    department: { type: String, default: "General" },
    avatar: { type: String, default: "" },
  },
  { _id: false }
);

const chatChannelSchema = new Schema<IChatChannel>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", index: true },
    channelId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["team", "group", "direct"],
      required: true,
      index: true,
    },
    description: { type: String, default: "" },
    createdBy: { type: String, default: "system" },
    creatorName: { type: String, default: "Admin" },
    memberIds: [{ type: String, index: true }],
    memberEmails: [{ type: String, index: true }],
    members: [chatChannelMemberSchema],
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const ChatChannel: Model<IChatChannel> =
  mongoose.models.ChatChannel || mongoose.model<IChatChannel>("ChatChannel", chatChannelSchema);

export default ChatChannel;
