import { Request, Response } from "express";
import Document from "../document/documentModel";;

interface AuthRequest extends Request {
  user?: any;
}

export const getProfileDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id; 

    // 1. Fetch real documents
    const recentDocuments = await Document.find({ author: userId })
      .sort({ updatedAt: -1 })
      .limit(4)
      .select("title type status chapters wordCount updatedAt");

    // 2. Calculate Total Words and Active Projects
    const statsAggregation = await Document.aggregate([
      { $match: { author: userId } },
      {
        $group: {
          _id: null,
          totalWords: { $sum: "$wordCount" },
          activeProjects: {
            $sum: { $cond: [{ $eq: ["$status", "Drafting"] }, 1, 0] } 
          }
        }
      }
    ]);

    const totalWords = statsAggregation[0]?.totalWords || 0;
    const activeProjects = statsAggregation[0]?.activeProjects || 0;
    
    // 3. Hardcoded to 0 to bypass the TypeScript error. We will link your Analytics later!
    const currentStreak = 0;

    res.status(200).json({
      success: true,
      data: {
        stats: { 
          totalWords, 
          currentStreak, 
          activeProjects 
        },
        recentDocuments
      }
    });

  } catch (error) {
    console.error("Profile Dashboard Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};