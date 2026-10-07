import mongoose, { Schema, Model } from "mongoose";
import bcrypt from "bcryptjs";
import { IUser } from "./types";
import { UserRole, UserStatus } from "./enums";

const userSchema = new Schema<IUser>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, select: false },
    role: {
      type: String,
      enum: ["superuser", "owner", "manager", "teamlead", "employee", "Owner", "Admin", "Manager", "Member", "Viewer"],
      default: UserRole.Employee,
      index: true,
    },
    isActive: { type: Boolean, default: true, index: true },
    avatarUrl: { type: String },
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
    performanceScore: { type: Number, default: 0 },
    completedProjectsCount: { type: Number, default: 0 },
    currentProjectsCount: { type: Number, default: 0 },
    relevancyScore: { type: Number, default: 0 },
    supervisorRating: { type: Number, default: 0 },
    teamLeadRating: { type: Number, default: 0 },
    remarks: { type: String, default: "Newly onboarded. Awaiting initial performance review." },
  },
  { timestamps: true }
);

// Compound index for multi-tenant isolation and fast lookup
userSchema.index({ companyId: 1, email: 1 });
userSchema.index({ companyId: 1, role: 1 });

// Hash password before saving if modified
userSchema.pre("save", async function () {
  if (this.isModified("passwordHash") && this.passwordHash) {
    if (!this.passwordHash.startsWith("$2a$") && !this.passwordHash.startsWith("$2b$")) {
      const salt = await bcrypt.genSalt(10);
      this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    }
  }
});

// Instance method for secure password comparison
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);

