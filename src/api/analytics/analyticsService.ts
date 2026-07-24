/**
 * @file analyticsService.ts
 * @desc Complex data aggregation for dashboards and heatmaps.
 */
import mongoose from "mongoose";
import WritingStat from "./writingStatModel";

const SNAPSHOT_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

export const recordSnapshot = async (
  userId: string,
  chapterId: string,
  novelId: string,
  wordCount: number,
) => {
  const tooSoon = await WritingStat.exists({
    userId,
    chapterId,
    createdAt: { $gte: new Date(Date.now() - SNAPSHOT_COOLDOWN_MS) },
  });

  // Silently skip if within cooldown to prevent DB flooding
  if (tooSoon) return null;

  return WritingStat.create({
    userId,
    chapterId,
    novelId,
    wordCountSnapshot: wordCount,
  });
};

export const getDailyWordCount = async (
  userId: string,
  targetDate: Date,
): Promise<number> => {
  const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

  const result = await WritingStat.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      },
    },
    { $sort: { createdAt: 1 } },
    {
      $group: {
        _id: "$chapterId",
        first: { $first: "$wordCountSnapshot" },
        last: { $last: "$wordCountSnapshot" },
      },
    },
    {
      $project: {
        wordsAdded: { $max: [0, { $subtract: ["$last", "$first"] }] },
      },
    },
    { $group: { _id: null, totalWordsToday: { $sum: "$wordsAdded" } } },
  ]);

  return result[0]?.totalWordsToday ?? 0;
};

export const calculateStreak = async (userId: string) => {
  const activeDays = await WritingStat.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
      },
    },
    { $sort: { _id: -1 } },
  ]);

  if (!activeDays.length) return { current: 0, longest: 0 };

  let [current, longest, temp] = [0, 0, 1];
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const mostRecentDay = activeDays[0]._id;

  if (mostRecentDay !== today && mostRecentDay !== yesterday)
    return { current: 0, longest: 0 };

  for (let i = 1; i < activeDays.length; i++) {
    const diffDays =
      (new Date(activeDays[i - 1]._id).getTime() -
        new Date(activeDays[i]._id).getTime()) /
      86400000;
    if (diffDays === 1) temp++;
    else {
      longest = Math.max(longest, temp);
      temp = 1;
    }
  }

  return { current: temp, longest: Math.max(longest, temp) };
};

export const getDashboardSummary = async (userId: string) => {
  const [wordsToday, streaks] = await Promise.all([
    getDailyWordCount(userId, new Date()),
    calculateStreak(userId),
  ]);
  return {
    wordsToday,
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
  };
};
