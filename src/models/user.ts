import mongoose, { Schema, Model } from "mongoose";
import { IUser } from "./types";
import { UserRole, UserStatus } from "./enums";

const userSchema = new Schema<IUser>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", index: true },
    name: { type: String, required: true },
    email: { type: String, index: true },
    avatarUrl: { type: String },
    role: {
      type: String,
      default: UserRole.Member,
    },
    teamIds: [{ type: Schema.Types.ObjectId, ref: "Team" }],
    position: { type: String },
    rank: { type: String },
    status: {
      type: String,
      default: UserStatus.Working,
    },
    capacityHoursPerWeek: { type: Number, default: 40 },
    skills: [{ type: String }],
    joinedDate: { type: Date, default: Date.now },
    leftDate: { type: Date },
    details: { type: String },
  },
  { timestamps: true }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);
