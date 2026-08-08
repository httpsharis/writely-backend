/**
 * @file authMiddleware.ts
 * @desc Secures routes by verifying Clerk JWT tokens and mapping to MongoDB users via JIT sync.
 */
import { Request, Response, NextFunction } from "express";
import { clerkClient, getAuth } from "@clerk/express";
import User from "../api/user/userModel";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    name?: string;
    email?: string;
  };
}

/**
 * Middleware to protect routes using Clerk.
 * Performs a Just-In-Time (JIT) sync to create a MongoDB user if they don't exist.
 */
export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      res.status(401).json({ error: "Not authorized, no token provided" });
      return;
    }

    // Lookup the user in MongoDB
    let mongoUser = await User.findOne({ clerkId: auth.userId });

    // JIT Sync: If user doesn't exist, create them
    if (!mongoUser) {
      // Fetch details from Clerk
      const clerkUser = await clerkClient.users.getUser(auth.userId);
      
      const email = clerkUser.emailAddresses[0]?.emailAddress || `${auth.userId}@placeholder.com`;
      const name = clerkUser.firstName 
        ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim()
        : 'New Writer';

      // Ensure username is unique
      const baseUsername = email.split('@')[0];
      let username = baseUsername;
      let counter = 1;
      while (await User.findOne({ username })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      mongoUser = await User.create({
        clerkId: auth.userId,
        email,
        name,
        username,
        profile: {
          avatarUrl: clerkUser.imageUrl || "",
        }
      });
    }

    // Attach the MongoDB ObjectId to the request so the rest of the backend works unchanged
    req.user = { 
      userId: mongoUser._id.toString(),
      email: mongoUser.email,
      name: mongoUser.name
    };

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.status(401).json({ error: "Not authorized, token failed or expired" });
  }
};
