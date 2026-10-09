import mongoose, { Schema, Model } from "mongoose";
import { ICompany } from "./types";
import { CompanyStatus } from "./enums";

const companySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    subdomain: { type: String, unique: true, sparse: true, lowercase: true, trim: true, index: true },
    companyCode: { type: String, unique: true, sparse: true, uppercase: true, trim: true, index: true },
    plan: { type: String, default: "Pro" },
    subscription: {
      planId: { type: String, enum: ["monthly", "quarterly", "annual"], default: "monthly" },
      planName: { type: String },
      startDate: { type: Date, default: Date.now },
      currentPeriodEnd: { type: Date },
      status: {
        type: String,
        enum: ["active", "past_due", "expired", "canceled"],
        default: "active",
      },
      razorpayPaymentId: { type: String },
      razorpayOrderId: { type: String },
      amountUsd: { type: Number },
      userCount: { type: Number, default: 1 },
      pricePerUserMonthly: { type: Number, default: 5 },
      baseStorageGB: { type: Number, default: 2 },
      extraStorageGB: { type: Number, default: 0 },
      storageAddonCostUSD: { type: Number, default: 0 },
      usedStorageBytes: { type: Number, default: 0 },
      nextBillingAmountUSD: { type: Number },
    },
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
