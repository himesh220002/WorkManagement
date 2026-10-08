import mongoose, { Schema, Model } from "mongoose";

export interface IContactMessage {
  _id?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  company?: string;
  message: string;
  status: "new" | "in_review" | "replied" | "archived";
  discordNotified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const contactMessageSchema = new Schema<IContactMessage>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    company: { type: String, default: "", trim: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["new", "in_review", "replied", "archived"],
      default: "new",
      index: true,
    },
    discordNotified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const ContactMessage: Model<IContactMessage> =
  mongoose.models.ContactMessage ||
  mongoose.model<IContactMessage>("ContactMessage", contactMessageSchema);

export default ContactMessage;
