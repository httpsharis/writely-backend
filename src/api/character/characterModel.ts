/**
 * @file characterModel.ts
 * @desc Mongoose schema for the Character entity. Characters can belong to a specific novel,
 * or be 'free-floating' (global) if novelId is null.
 */

import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICharacter extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId; // Characters MUST have an owner, especially global ones!
  novelId: Types.ObjectId | null; // Allowed null for global characters
  name: string;
  role: "protagonist" | "antagonist" | "supporting" | "minor";
  bio?: string;
  traits: string[];
  relationships: {
    targetCharacterId: Types.ObjectId;
    relationshipType: string;
  }[];
  aliases: string[];
  avatarUrl?: string;
  status: "alive" | "dead" | "unknown";
  createdAt: Date;
  updatedAt: Date;
}

const CharacterSchema = new Schema<ICharacter>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    novelId: { type: Schema.Types.ObjectId, ref: "Document", default: null },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ["protagonist", "antagonist", "supporting", "minor"],
      default: "supporting",
    },
    bio: { type: String, default: "", maxLength: 2000 },
    traits: [{ type: String }],
    relationships: [
      {
        targetCharacterId: {
          type: Schema.Types.ObjectId,
          ref: "Character",
          required: true,
        },
        relationshipType: { type: String, required: true },
      },
    ],
    aliases: [{ type: String }],
    avatarUrl: { type: String, default: "" },
    status: {
      type: String,
      enum: ["alive", "dead", "unknown"],
      default: "alive",
    },
  },
  { timestamps: true },
);

CharacterSchema.index({ userId: 1, novelId: 1, role: 1 });
CharacterSchema.index({ name: 'text', aliases: 'text', role: 'text' }, { name: 'CharacterTextIndex' });

export default mongoose.model<ICharacter>("Character", CharacterSchema);
