import mongoose, { Schema, Model } from "mongoose";

export interface IItem {
  _id?: string;
  name: string;
  completed: boolean;
  priority: string;
  createdAt?: string;
}

export interface IList {
  _id?: string;
  name: string;
  items: any;
}

const itemsSchema = new Schema<IItem>({
  name: { type: String, required: true },
  completed: { type: Boolean, default: false },
  priority: { type: String, default: "medium" },
  createdAt: {
    type: String,
    default: () => new Date().toISOString(),
  },
});

export const Item: Model<IItem> =
  mongoose.models.Item || mongoose.model<IItem>("Item", itemsSchema);

const listSchema = new Schema<IList>({
  name: { type: String, required: true },
  items: [itemsSchema],
});

export const List: Model<IList> =
  mongoose.models.List || mongoose.model<IList>("List", listSchema);
