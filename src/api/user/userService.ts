import Document from "../document/documentModel";
import User, { IUser } from "./userModel";
import * as analyticsService from "../analytics/analyticsService";
import WritingGoal from "../analytics/writingGoalModel";
import { NotFoundError } from "../../utils/errors";
import mongoose from "mongoose";
import WritingStat from "../analytics/writingStatModel";

interface CreateUserDTO {
  email: string;
  name: string;
  googleId?: string;
  password?: string;
  profilePicture?: string;
  profile?: Partial<IUser["profile"]>;
}

export const getMinimalDashboard = async (userId: string) => {
  const [recentDocuments, wordsToday] = await Promise.all([
    // 1. Get the 5 most recently edited novels or chapters
    Document.find({ owner: userId, type: { $in: ["novel", "chapter"] } })
      .select("title slug type updatedAt parentId") // Exclude heavy content payloads
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean(),

    // 2. Get just today's word count for the progress bar
    analyticsService.getDailyWordCount(userId, new Date()),
  ]);

  return {
    wordsToday,
    recentDocuments,
  };
};

export const getProfileAnalytics = async (userId: string) => {
  // The Trophy Room: Heavy data loading, only run when they visit the profile page

  // Calculate the 30-day cutoff for the heatmap
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [user, streaks, activeGoals, thirtyDayHeatmap] = await Promise.all([
    User.findById(userId).lean(),
    analyticsService.calculateStreak(userId),
    WritingGoal.find({ userId, isActive: true }).lean(),

    // Advanced Aggregation: Generate a 30-day daily word count array for a GitHub-style heatmap
    WritingStat.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          dailyMax: { $max: "$wordCountSnapshot" }, // Approximates total per day simply
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
      heatmap: thirtyDayHeatmap, // Returns array of { _id: '2023-10-01', dailyMax: 1500 }
    },
    goals: activeGoals,
  };
};

export const getPublicAuthorProfile = async (userId: string) => {
  const user = await User.findById(userId)
    .select("name profile createdAt")
    .lean();

  if (!user) throw new NotFoundError("Author not found");

  const publishedNovels = await Document.find({
    owner: userId,
    type: "novel",
    status: "published",
  })
    .select("title slug coverImage synopsis genre createdAt likesCount")
    .sort({ createdAt: -1 })
    .lean();

  return {
    author: {
      name: user.name,
      bio: user.profile?.bio,
      avatarUrl: user.profile?.avatarUrl,
      website: user.profile?.website,
      socialLinks: user.profile?.socialLinks,
      joinedAt: user.createdAt,
    },
    novels: publishedNovels,
  };
};

export const findUserByEmail = async (email: string) => {
  return await User.findOne({ email }).select("-refreshToken");
};

export const findUserById = async (userId: string) => {
  return await User.findById(userId);
};

export const createUser = async (userData: CreateUserDTO) => {
  try {
    return await User.create({
      email: userData.email,
      name: userData.name,
      googleId: userData.googleId,
      password: userData.password,
      profile: {
        avatarUrl: userData.profilePicture,
      },
    });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: number }).code === 11000
    ) {
      // Race condition - user was created in parallel request
      return await User.findOne({ email: userData.email });
    }
    throw error;
  }
};

export const saveRefreshToken = async (
  userId: string,
  refreshToken: string | null,
) => {
  return await User.findByIdAndUpdate(userId, { refreshToken }, { new: true });
};
