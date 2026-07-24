import mongoose, { Schema, Document } from "mongoose";

export interface IDocument extends Document {
  title: string;
  slug: string;
  content: any;
  owner: mongoose.Types.ObjectId;
  status: "draft" | "published" | "archived";
  type: "novel" | "chapter";
  parentId: mongoose.Types.ObjectId | null;
  order: number;
  synopsis: string;
  tags: string[];
  genre: string[];
  targetWords?: number;
  coverImage?: string;
  wordCount?: number;
  chapters?: IDocument[];
  viewsCount: number;
  likesCount: number;
  icon?: string;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    title: { type: String, required: true, default: "Untitled" },
    slug: { type: String, required: true, unique: true },
    content: { type: Schema.Types.Mixed, default: {} },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },

    type: { type: String, enum: ["novel", "chapter"], required: true },

    parentId: { type: Schema.Types.ObjectId, ref: "Document", default: null },
    order: { type: Number, default: 0 },

    synopsis: { type: String },
    genre: [{ type: String }],
    tags: [{ type: String }],
    wordCount: { type: Number },
    targetWords: { type: Number },
    coverImage: { type: String },

    icon: { type: String },

    viewsCount: { type: Number, default: 0 },
    likesCount: { type: Number, default: 0 },

    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Performance & Relational Indexes
DocumentSchema.index({ owner: 1, type: 1, updatedAt: -1 }); // "Get my novels"
DocumentSchema.index({ parentId: 1, order: 1 }); // "Get chapters for this novel, in order"
DocumentSchema.index({ status: 1, type: 1 }); // "Public library query"

export default mongoose.model<IDocument>("Document", DocumentSchema);
