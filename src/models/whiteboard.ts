import mongoose, { Schema, Model } from "mongoose";

export type WhiteboardNodeType =
  | "task"
  | "shape"
  | "sticky"
  | "text"
  | "frame"
  | "logo"
  | "legend"
  | "drawing"
  | "image"
  | "file"
  | "pdf"
  | "markdown"
  | "json"
  | "graphml";

export interface IWhiteboardNode {
  id: string;
  type: WhiteboardNodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  subtitle?: string;
  body?: string;
  color?: string;
  fillType?: "solid" | "tint" | "pattern" | "none";
  shapeType?: "rectangle" | "rounded" | "circle" | "diamond" | "triangle" | "star" | "heart" | "arrow-right" | "hexagon";
  fontSize?: string;
  fontWeight?: string;
  textAlign?: "left" | "center" | "right";
  assignee?: string;
  status?: string;
  zIndex?: number;
  pathData?: string;
  strokeWidth?: number;
  imageUrl?: string;
  progress?: number;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileExtension?: string;
  s3Key?: string;
  previewText?: string;
  metaData?: Record<string, any>;
}

export interface IWhiteboardEdge {
  id: string;
  from: string;
  to: string;
  fromAnchor?: "top" | "bottom" | "left" | "right";
  toAnchor?: "top" | "bottom" | "left" | "right";
  label?: string;
  color?: string;
  style?: "orthogonal" | "straight" | "curved" | "solid" | "dashed";
  lineStyle?: "solid" | "dashed";
  arrowDirection?: "forward" | "backward" | "bidirectional" | "none";
}

export interface IWhiteboard {
  _id: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  templateId:
    | "org-chart"
    | "action-plan"
    | "customer-journey"
    | "meeting-notes"
    | "notes"
    | "diagram"
    | "project-planner"
    | "blank";
  isFavorite: boolean;
  authorName: string;
  authorId?: string;
  authorInitials?: string;
  nodes: IWhiteboardNode[];
  edges: IWhiteboardEdge[];
  createdAt?: Date;
  updatedAt?: Date;
}

const whiteboardSchema = new Schema<IWhiteboard>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", index: true, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    templateId: {
      type: String,
      enum: [
        "org-chart",
        "action-plan",
        "customer-journey",
        "meeting-notes",
        "notes",
        "diagram",
        "project-planner",
        "blank",
      ],
      default: "blank",
    },
    isFavorite: { type: Boolean, default: false, index: true },
    authorName: { type: String, default: "Admin" },
    authorId: { type: String, default: "" },
    authorInitials: { type: String, default: "HS" },
    nodes: [
      {
        id: { type: String, required: true },
        type: {
          type: String,
          enum: [
            "task",
            "shape",
            "sticky",
            "text",
            "frame",
            "logo",
            "legend",
            "drawing",
            "image",
            "file",
            "pdf",
            "markdown",
            "json",
            "graphml",
          ],
          default: "shape",
        },
        imageUrl: { type: String, default: "" },
        fileUrl: { type: String, default: "" },
        fileName: { type: String, default: "" },
        fileSize: { type: Number, default: 0 },
        fileExtension: { type: String, default: "" },
        s3Key: { type: String, default: "" },
        previewText: { type: String, default: "" },
        metaData: { type: Schema.Types.Mixed, default: {} },
        progress: { type: Number, default: 0 },
        x: { type: Number, required: true },
        y: { type: Number, required: true },
        width: { type: Number, required: true },
        height: { type: Number, required: true },
        title: { type: String, default: "" },
        subtitle: { type: String, default: "" },
        body: { type: String, default: "" },
        color: { type: String, default: "#0078D4" },
        fillType: {
          type: String,
          enum: ["solid", "tint", "pattern", "none"],
          default: "solid",
        },
        shapeType: {
          type: String,
          enum: [
            "rectangle",
            "rounded",
            "circle",
            "diamond",
            "triangle",
            "star",
            "heart",
            "arrow-right",
            "hexagon",
          ],
          default: "rectangle",
        },
        fontSize: { type: String, default: "Medium" },
        fontWeight: { type: String, default: "normal" },
        textAlign: { type: String, default: "left" },
        assignee: { type: String, default: "" },
        status: { type: String, default: "" },
        zIndex: { type: Number, default: 1 },
        pathData: { type: String, default: "" },
        strokeWidth: { type: Number, default: 3 },
      },
    ],
    edges: [
      {
        id: { type: String, required: true },
        from: { type: String, required: true },
        to: { type: String, required: true },
        fromAnchor: { type: String, default: "bottom" },
        toAnchor: { type: String, default: "top" },
        label: { type: String, default: "" },
        color: { type: String, default: "#60A5FA" },
        style: {
          type: String,
          enum: ["orthogonal", "straight", "curved", "solid", "dashed"],
          default: "orthogonal",
        },
        lineStyle: {
          type: String,
          enum: ["solid", "dashed"],
          default: "solid",
        },
        arrowDirection: {
          type: String,
          enum: ["forward", "backward", "bidirectional", "none"],
          default: "forward",
        },
      },
    ],
  },
  { timestamps: true }
);

export const Whiteboard: Model<IWhiteboard> =
  mongoose.models.Whiteboard || mongoose.model<IWhiteboard>("Whiteboard", whiteboardSchema);

export default Whiteboard;
