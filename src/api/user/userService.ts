/**
 * @file userService.ts
 * @desc Core domain logic for Users. Executes highly-optimized MongoDB queries.
 */

import mongoose, { Types } from "mongoose";
import User from "./userModel";
import Document from "../document/documentModel";
import WritingGoal from "../analytics/writingGoalModel";
import WritingStat from "../analytics/writingStatModel";
import * as analyticsService from "../analytics/analyticsService";
import { NotFoundError } from "../../utils/errors";

interface CreateUserDTO {
  email: string;
  name: string;
  username?: string;
  googleId?: string;
  password?: string;
  profilePicture?: string;
}

// 🔒 SECURITY CONSTANTS
const PUBLIC_AUTHOR_FIELDS = "name username profile createdAt";
const PRIVATE_PROFILE_FIELDS = "name username email profile settings";

// --- CORE USER CRUD ---

export const findUserById = async (userId: string) => User.findById(userId);
export const findUserByEmail = async (email: string) => User.findOne({ email });
export const findUserByUsername = async (username: string) =>
  User.findOne({ username });
export const findUserByEmailWithPassword = async (email: string) =>
  User.findOne({ email }).select("+password");

export const createUser = async (userData: CreateUserDTO) => {
  try {
    return await User.create({
      ...userData,
      profile: { avatarUrl: userData.profilePicture },
    });
  } catch (error: any) {
    // Graceful fallback for duplicate key errors (OAuth race conditions)
    if (error.code === 11000) return User.findOne({ email: userData.email });
    throw error;
  }
};

export const saveRefreshToken = async (
  userId: string,
  refreshToken: string | null,
) => User.findByIdAndUpdate(userId, { refreshToken }, { new: true });

export const updateUserProfile = async (
  userId: string,
  data: { name?: string; username?: string; bio?: string },
) => {
  const updateData: Record<string, string> = {};

  if (data.name) updateData.name = data.name;
  if (data.username) updateData.username = data.username;
  if (data.bio) updateData["profile.bio"] = data.bio; // Safe nested update

  return User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    { new: true, runValidators: true },
  ).select(PRIVATE_PROFILE_FIELDS);
};

// --- DASHBOARD & ANALYTICS ---

export const getMinimalDashboard = async (userId: string) => {
  const [recentDocuments, wordsToday] = await Promise.all([
    Document.find({ owner: userId, type: { $in: ["novel", "chapter"] } })
      .select("title slug type updatedAt parentId")
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean(),
    analyticsService.getDailyWordCount(userId, new Date()),
  ]);

  return { wordsToday, recentDocuments };
};

export const getProfileAnalytics = async (userId: string) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [user, streaks, activeGoals, thirtyDayHeatmap] = await Promise.all([
    User.findById(userId).select(PRIVATE_PROFILE_FIELDS).lean(),
    analyticsService.calculateStreak(userId),
    WritingGoal.find({ userId, isActive: true }).lean(),

    // GitHub-Style Heatmap Aggregation
    WritingStat.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            chapterId: "$chapterId",
          },
          first: { $first: "$wordCountSnapshot" },
          last: { $last: "$wordCountSnapshot" },
        },
      },
      {
        $project: {
          date: "$_id.date",
          wordsAdded: { $max: [0, { $subtract: ["$last", "$first"] }] },
        },
      },
      {
        $group: {
          _id: "$date",
          dailyMax: { $sum: "$wordsAdded" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  if (!user) throw new NotFoundError("User profile not found");

  return {
    profile: user.profile,
    settings: user.settings,
    analytics: {
      currentStreak: streaks.current,
      longestStreak: streaks.longest,
      heatmap: thirtyDayHeatmap,
    },
    goals: activeGoals,
  };
};

export const getPublicAuthorProfile = async (username: string) => {
  const user = await User.findOne({ username })
    .select(PUBLIC_AUTHOR_FIELDS)
    .lean();
  if (!user) throw new NotFoundError("Author not found");

  const publishedNovels = await Document.find({
    owner: user._id,
    type: "novel",
    status: "published",
  })
    .select("title slug coverImage synopsis genre createdAt likesCount")
    .sort({ createdAt: -1 })
    .lean();

  return { author: user, novels: publishedNovels };
};
