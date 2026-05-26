import Document from '../document/documentModel';
import User from './userModel';
import * as analyticsService from '../analytics/analyticsService';
import WritingGoal from '../analytics/writingGoalModel';
import { NotFoundError } from '../../utils/errors';
import mongoose from 'mongoose';
import WritingStat from '../analytics/writingStatModel';

export const getMinimalDashboard = async (userId: string) => {
    const [recentDocuments, wordsToday] = await Promise.all([
        // 1. Get the 5 most recently edited novels or chapters
        Document.find({ owner: userId, type: { $in: ['novel', 'chapter'] } })
            .select('title slug type updatedAt parentId') // Exclude heavy content payloads
            .sort({ updatedAt: -1 })
            .limit(5)
            .lean(),
        
        // 2. Get just today's word count for the progress bar
        analyticsService.getDailyWordCount(userId, new Date())
    ]);

    return {
        wordsToday,
        recentDocuments
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
                    createdAt: { $gte: thirtyDaysAgo } 
                } 
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    dailyMax: { $max: '$wordCountSnapshot' }, // Approximates total per day simply
                }
            },
            { $sort: { _id: 1 } }
        ])
    ]);

    if (!user) throw new NotFoundError('User profile not found');

    return {
        profile: user.profile,
        settings: user.settings,
        analytics: {
            currentStreak: streaks.current,
            longestStreak: streaks.longest,
            heatmap: thirtyDayHeatmap // Returns array of { _id: '2023-10-01', dailyMax: 1500 }
        },
        goals: activeGoals
    };
};