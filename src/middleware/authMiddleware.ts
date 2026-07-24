/**
 * @file authMiddleware.ts
 * @desc Secures routes by verifying JWT tokens and attaching user data to the request.
 */
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Express Request to include custom user data across the app
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    name?: string;
    email?: string;
  };
}

/**
 * Middleware to protect routes. Extracts Bearer token, verifies it,
 * and populates req.user. Throws 401 on failure.
 */
export const protect = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  let token: string | undefined;

  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    res.status(401).json({ error: "Not authorized, no token provided" });
    return;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET as string,
    ) as { userId: string };
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Not authorized, token failed or expired" });
  }
};
