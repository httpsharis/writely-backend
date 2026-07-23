/**
 * @file userModel.ts
 * @desc Mongoose schema and types for the User collection.
 * Strictly isolated from HTTP transport layers and route logic.
 */

// 1. SENIOR FIX: Import Types directly from mongoose as a type namespace
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId; // 🟢 Now perfectly recognized by TypeScript
  googleId?: string;
  password?: string;
  email: string;
  name: string;
  username: string;
  refreshToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  role: "user" | "admin" | "moderator";
  plan: "free" | "pro";
  profile: {
    bio?: string;
    avatarUrl?: string;
    website?: string;
    socialLinks?: { twitter?: string; instagram?: string };
  };
  settings: {
    theme: "light" | "dark" | "system";
    timezone: string;
    notifications: { emailWeeklySummary: boolean; pushMilestones: boolean };
    editor: { fontFamily: string; fontSize: number; focusMode: boolean };
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    googleId: { type: String, unique: true, sparse: true },
    password: { type: String, select: false },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    refreshToken: { type: String, default: null },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    role: {
      type: String,
      enum: ["user", "admin", "moderator"],
      default: "user",
    },
    plan: { type: String, enum: ["free", "pro"], default: "free" },
    profile: {
      bio: { type: String, default: "", maxLength: 500 },
      avatarUrl: { type: String, default: "" },
      website: { type: String, default: "" },
      socialLinks: {
        twitter: { type: String, default: "" },
        instagram: { type: String, default: "" },
      },
    },
    settings: {
      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "system",
      },
      timezone: { type: String, default: "UTC" },
      notifications: {
        emailWeeklySummary: { type: Boolean, default: true },
        pushMilestones: { type: Boolean, default: true },
      },
      editor: {
        fontFamily: { type: String, default: "serif" },
        fontSize: { type: Number, default: 18 },
        focusMode: { type: Boolean, default: false },
      },
    },
  },
  { timestamps: true },
);

UserSchema.pre<IUser>("save", async function () {
  if (!this.googleId && !this.password) {
    throw new Error("A user must have either a googleId or a password.");
  }
});

export default mongoose.model<IUser>("User", UserSchema);
