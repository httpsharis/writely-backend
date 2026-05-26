import mongoose from 'mongoose';
import WritingStat, { IWritingStat } from './writingStatModel';

const SNAPSHOT_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

export const recordSnapshot = async (
    userId: string,
    chapterId: string,
    novelId: string,
    wordCount: number
): Promise<IWritingStat | null> => {
    const cooldownThreshold = new Date(Date.now() - SNAPSHOT_COOLDOWN_MS);

    // 1. Throttling: Check if we already recorded a snapshot for this chapter in the last 5 minutes
    const tooSoon = await WritingStat.findOne({
        userId,
        chapterId,
        createdAt: { $gte: cooldownThreshold }
    }).lean(); // .lean() makes this check lightning fast

    if (tooSoon) {
        return null; // Silently skip to protect the database from flooding
    }

    // 2. Record the snapshot
    return await WritingStat.create({
        userId,
        chapterId,
        novelId,
        wordCountSnapshot: wordCount
    });
};

export const getDailyWordCount = async (userId: string, targetDate: Date): Promise<number> => {
    // Force the date to local midnight bounds
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await WritingStat.aggregate([
        // Step 1: Isolate this user's snapshots for the requested day
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
                createdAt: { $gte: startOfDay, $lte: endOfDay }
            }
        },
        // Step 2: Group by chapter and grab the first and last snapshot of the day
        {
            $group: {
                _id: '$chapterId',
                firstSnapshot: { $first: '$wordCountSnapshot' },
                lastSnapshot: { $last: '$wordCountSnapshot' }
            }
        },
        // Step 3: Calculate the delta. The $max: [0, ...] prevents negative numbers if they deleted a chapter.
        {
            $project: {
                wordsAdded: {
                    $max: [0, { $subtract: ['$lastSnapshot', '$firstSnapshot'] }]
                }
            }
        },
        // Step 4: Sum all the chapter deltas into one final daily total
        {
            $group: {
                _id: null,
                totalWordsToday: { $sum: '$wordsAdded' }
            }
        }
    ]);

    return result[0]?.totalWordsToday ?? 0;
};

export const calculateStreak = async (userId: string): Promise<{ current: number, longest: number }> => {
    // Step 1: Find all distinct days the user was active
    const activeDays = await WritingStat.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                // Group by YYYY-MM-DD
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
            }
        },
        { $sort: { _id: -1 } } // Sort newest to oldest
    ]);

    if (activeDays.length === 0) return { current: 0, longest: 0 };

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const mostRecentDay = activeDays[0]._id;

    // Step 2: Check if the streak is currently alive
    if (mostRecentDay !== today && mostRecentDay !== yesterday) {
        currentStreak = 0; // Streak is dead
    } else {
        // Step 3: Walk backwards through the days to count the streak
        for (let i = 1; i < activeDays.length; i++) {
            const prevDate = new Date(activeDays[i - 1]._id);
            const currDate = new Date(activeDays[i]._id);
            
            // Calculate day difference
            const diffDays = (prevDate.getTime() - currDate.getTime()) / 86400000;

            if (diffDays === 1) {
                tempStreak++;
            } else {
                longestStreak = Math.max(longestStreak, tempStreak);
                tempStreak = 1; // Reset temporary counter
            }
        }
        currentStreak = tempStreak;
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    return { current: currentStreak, longest: longestStreak };
};

export const getDashboardSummary = async (userId: string): Promise<any> => {
    // Parallelize the queries so the dashboard loads instantly
    const [todayWords, streaks] = await Promise.all([
        getDailyWordCount(userId, new Date()),
        calculateStreak(userId)
    ]);

    return {
        wordsToday: todayWords,
        currentStreak: streaks.current,
        longestStreak: streaks.longest
    };
};