import mongoose, { Schema, Document } from "mongoose";

export interface ICharacter extends Document {
  novelId: mongoose.Types.ObjectId;
  name: string;
  role: "protagonist" | "antagonist" | "supporting" | "minor";
  bio?: string;
  traits: string[]; // e.g., ["brave", "reckless", "cunning"]
  relationships: {
    targetCharacterId: mongoose.Types.ObjectId;
    relationshipType: string; // e.g., "sister", "nemesis", "mentor"
  }[];
  aliases: string[];
  avatarUrl?: string;
  status: "alive" | "dead" | "unknown";
  createdAt: Date;
  updatedAt: Date;
}

const CharacterSchema = new Schema<ICharacter>(
  {
    novelId: {
      type: Schema.Types.ObjectId,
      ref: "Document",
      required: false,
      default: null,
    },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ["protagonist", "antagonist", "supporting", "minor"],
      default: "supporting",
    },
    bio: { type: String },
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
    avatarUrl: { type: String },
    status: {
      type: String,
      enum: ["alive", "dead", "unknown"],
      default: "alive",
    },
  },
  { timestamps: true },
);

// Index to instantly fetch all characters for a specific novel
CharacterSchema.index({ novelId: 1, role: 1 });

export default mongoose.model<ICharacter>("Character", CharacterSchema);
