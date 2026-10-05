import mongoose, { Schema, Model } from "mongoose";
import { ICompany } from "./types";
import { CompanyStatus } from "./enums";

const companySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    logoUrl: { type: String },
    industry: { type: String },
    fiscalYearStart: { type: String, default: "01-01" },
    settings: {
      currency: { type: String, default: "USD" },
      timezone: { type: String, default: "UTC" },
      workingDays: { type: [Number], default: [1, 2, 3, 4, 5] },
    },
    status: {
      type: String,
      enum: Object.values(CompanyStatus),
      default: CompanyStatus.Active,
      index: true,
    },
  },
  { timestamps: true }
);

export const Company: Model<ICompany> =
  mongoose.models.Company || mongoose.model<ICompany>("Company", companySchema);
