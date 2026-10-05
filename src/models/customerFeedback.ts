import mongoose, { Schema, Model } from "mongoose";
import { ICustomerFeedback } from "./types";
import { FeedbackType, FeedbackStatus, Priority } from "./enums";

const customerFeedbackSchema = new Schema<ICustomerFeedback>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
    title: { type: String, required: true },
    type: {
      type: String,
      default: FeedbackType.FeatureRequest,
    },
    priority: {
      type: String,
      default: Priority.Medium,
    },
    status: {
      type: String,
      default: FeedbackStatus.New,
      index: true,
    },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

export const CustomerFeedback: Model<ICustomerFeedback> =
  mongoose.models.CustomerFeedback || mongoose.model<ICustomerFeedback>("CustomerFeedback", customerFeedbackSchema);
