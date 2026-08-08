/**
 * @file analyticsService.ts
 * @desc Complex data aggregation for dashboards and heatmaps.
 */
import mongoose from "mongoose";
import WritingStat from "./writingStatModel";
import Document from "../document/documentModel";

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

export const getWordCountInRange = async (
  userId: string,
  startDate: Date,
  endDate: Date,
): Promise<number> => {
  const result = await WritingStat.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate, $lte: endDate },
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
    { $group: { _id: null, totalWordsAdded: { $sum: "$wordsAdded" } } },
  ]);

  return result[0]?.totalWordsAdded ?? 0;
};

export const getTotalWords = async (userId: string): Promise<number> => {
  const result = await Document.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
        type: "novel", // sum word counts of root novels only, as chapters contribute to their parent's wordCount
      },
    },
    { $group: { _id: null, totalWords: { $sum: "$wordCount" } } },
  ]);

  return result[0]?.totalWords ?? 0;
};

export const getDailyWordCount = async (userId: string, date: Date): Promise<number> => {
  const targetDate = new Date(date);
  const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
  return getWordCountInRange(userId, startOfDay, endOfDay);
};

export const calculateStreak = async (userId: string) => {
  const activeDays = await WritingStat.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" } }, // Force UTC grouping
      },
    },
    { $sort: { _id: -1 } },
  ]);

  if (!activeDays.length) return { current: 0, longest: 0 };

  let [longest, temp] = [0, 1];
  
  // DST FIX: Use precise Date methods for Today and Yesterday in UTC
  const todayDate = new Date();
  const today = todayDate.toISOString().split("T")[0];
  
  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setUTCDate(todayDate.getUTCDate() - 1);
  const yesterday = yesterdayDate.toISOString().split("T")[0];

  const mostRecentDay = activeDays[0]._id;

  if (mostRecentDay !== today && mostRecentDay !== yesterday) {
    return { current: 0, longest: 0 };
  }

  for (let i = 1; i < activeDays.length; i++) {
    // DST FIX: Parse dates as strict UTC midnight to avoid 23/25 hour gaps
    const date1 = new Date(activeDays[i - 1]._id + "T00:00:00Z").getTime();
    const date2 = new Date(activeDays[i]._id + "T00:00:00Z").getTime();
    
    // Now it is perfectly safe to divide by 86400000 because both dates are locked to UTC midnight
    const diffDays = Math.round((date1 - date2) / 86400000);

    if (diffDays === 1) {
      temp++;
    } else {
      longest = Math.max(longest, temp);
      temp = 1;
    }
  }

  return { current: temp, longest: Math.max(longest, temp) };
};

export const getDashboardSummary = async (userId: string) => {
  const [wordsToday, streaks, totalWords] = await Promise.all([
    getDailyWordCount(userId, new Date()),
    calculateStreak(userId),
    getTotalWords(userId),
  ]);
  return {
    wordsToday,
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
    totalWords,
  };
};