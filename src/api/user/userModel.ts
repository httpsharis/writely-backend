import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  googleId?: string;
  password?: string;
  email: string;
  name: string;
  refreshToken?: string;

  // 🟢 The Public Author Profile
  profile: {
    bio?: string;
    avatarUrl?: string;
    website?: string;
    socialLinks?: {
      twitter?: string;
      instagram?: string;
    };
  };

  // 🟢 The Global App Settings
  settings: {
    theme: "light" | "dark" | "system";
    notifications: {
      emailWeeklySummary: boolean;
      pushMilestones: boolean;
    };
    editor: {
      fontFamily: string; // e.g., 'serif', 'sans-serif', 'monospace'
      fontSize: number; // e.g., 16
      focusMode: boolean; // Distraction-free writing toggle
    };
  };

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    googleId: { type: String, unique: true, sparse: true },
    password: { type: String, select: false },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    refreshToken: { type: String, default: null },

    profile: {
      bio: { type: String, default: null },
      avatarUrl: { type: String, default: null },
      website: { type: String, default: null },
      socialLinks: {
        twitter: { type: String, default: null },
        instagram: { type: String, default: null },
      },
    },

    settings: {
      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "system",
      },
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

UserSchema.pre("validate", function (next) {
  if (!this.googleId && !this.password) {
    next(new Error("A user must have either a googleId or a password."));
  } else {
    next();
  }
});

export default mongoose.model<IUser>("User", UserSchema);
