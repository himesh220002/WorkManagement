import mongoose, { Schema, Model } from "mongoose";

export interface ISavedPerson {
  _id: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  ownerUserId: string; // The user who saved this contact
  personUserId: string; // The teammate being saved
  personName: string;
  personEmail: string;
  personRole: string;
  personDepartment?: string;
  personAvatar?: string;
  mentionCount: number;
  lastMentionedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const savedPersonSchema = new Schema<ISavedPerson>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", index: true, required: true },
    ownerUserId: { type: String, required: true, index: true },
    personUserId: { type: String, required: true, index: true },
    personName: { type: String, required: true },
    personEmail: { type: String, default: "" },
    personRole: { type: String, default: "Team Member" },
    personDepartment: { type: String, default: "General" },
    personAvatar: { type: String, default: "" },
    mentionCount: { type: Number, default: 1 },
    lastMentionedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

savedPersonSchema.index({ ownerUserId: 1, personUserId: 1 }, { unique: true });

export const SavedPerson: Model<ISavedPerson> =
  mongoose.models.SavedPerson || mongoose.model<ISavedPerson>("SavedPerson", savedPersonSchema);

export default SavedPerson;
