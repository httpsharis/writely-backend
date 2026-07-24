/**
 * @file documentModel.ts
 * @desc Mongoose schema for Novels and Chapters. Uses self-referencing
 * (parentId) to link chapters to novels.
 */

import mongoose, { Schema, Document, Types } from "mongoose";

export interface IDocument extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  content: Record<string, unknown>;
  owner: Types.ObjectId;
  status: "draft" | "published" | "archived";
  type: "novel" | "chapter";
  parentId: Types.ObjectId | null;
  order: number;
  synopsis?: string;
  tags?: string[];
  genre?: string[];
  targetWords?: number;
  coverImage?: string;
  wordCount?: number;
  chapters?: IDocument[]; // Virtual field for populated child chapters
  viewsCount: number;
  likesCount: number;
  icon?: string;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    title: { type: String, required: true, default: "Untitled", trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
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
    synopsis: { type: String, default: "", maxLength: 2000 },
    genre: [{ type: String }],
    tags: [{ type: String }],
    wordCount: { type: Number, default: 0 },
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
// Text Index for Omni-Search
DocumentSchema.index(
  { title: "text", synopsis: "text" },
  { name: "DocumentTextIndex" },
);
DocumentSchema.index({ owner: 1, type: 1, updatedAt: -1 });
DocumentSchema.index({ parentId: 1, order: 1 });
DocumentSchema.index({ status: 1, type: 1 });

export default mongoose.model<IDocument>("Document", DocumentSchema);
