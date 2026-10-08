import mongoose, { Schema, Model } from "mongoose";

export interface IClientInteraction {
  _id?: any;
  type: "Meeting" | "Call" | "Email" | "Contract" | "Support";
  summary: string;
  date: Date;
  recordedBy?: string;
}

export interface IClientAccount {
  _id?: any;
  companyId?: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  accountName: string;
  tier: "Enterprise Key" | "Tier 1 Strategic" | "Tier 2 Growth" | "Mid-Market";
  lifecycleStage: "Prospect" | "Active Pilot" | "Active Enterprise" | "Contract Expansion" | "Renewal Pending" | "At-Risk";
  industry: string;
  region: string;
  contractARR: number;
  healthScore: number; // 0 - 100
  primaryContact: {
    name: string;
    title: string;
    email: string;
    phone?: string;
  };
  accountExecutive?: string;
  nextAction?: {
    action: string;
    dueDate?: Date;
  };
  interactions: IClientInteraction[];
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const clientInteractionSchema = new Schema<IClientInteraction>(
  {
    type: { type: String, enum: ["Meeting", "Call", "Email", "Contract", "Support"], default: "Meeting" },
    summary: { type: String, required: true },
    date: { type: Date, default: Date.now },
    recordedBy: { type: String, default: "Account Executive" },
  },
  { _id: true }
);

const clientAccountSchema = new Schema<IClientAccount>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
    accountName: { type: String, required: true, trim: true, index: true },
    tier: {
      type: String,
      enum: ["Enterprise Key", "Tier 1 Strategic", "Tier 2 Growth", "Mid-Market"],
      default: "Tier 1 Strategic",
    },
    lifecycleStage: {
      type: String,
      enum: ["Prospect", "Active Pilot", "Active Enterprise", "Contract Expansion", "Renewal Pending", "At-Risk"],
      default: "Active Enterprise",
      index: true,
    },
    industry: { type: String, default: "Technology" },
    region: { type: String, default: "North America" },
    contractARR: { type: Number, default: 0 },
    healthScore: { type: Number, default: 90, min: 0, max: 100 },
    primaryContact: {
      name: { type: String, required: true },
      title: { type: String, default: "Decision Maker" },
      email: { type: String, required: true },
      phone: { type: String, default: "" },
    },
    accountExecutive: { type: String, default: "Sarah Connor (Owner)" },
    nextAction: {
      action: { type: String, default: "Quarterly Business Review" },
      dueDate: { type: Date },
    },
    interactions: { type: [clientInteractionSchema], default: [] },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

clientAccountSchema.index({ companyId: 1, lifecycleStage: 1 });
clientAccountSchema.index({ companyId: 1, tier: 1 });

export const ClientAccount: Model<IClientAccount> =
  mongoose.models.ClientAccount || mongoose.model<IClientAccount>("ClientAccount", clientAccountSchema);
