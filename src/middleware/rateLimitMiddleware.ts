/**
 * @file rateLimiter.ts
 * @desc Protects the API from Brute Force and DDoS attacks.
 * Uses Identity-based tracking to prevent blocking shared Wi-Fi networks.
 */
import { rateLimit } from "express-rate-limit";
import * as crypto from "crypto";
import { Request } from "express";

/**
 * @desc Strict limiter specifically for /login and /register routes.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per IP
  message: {
    error: "Too many authentication attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @desc General API limiter. Uses JWT tokens to identify users,
 * falling back to IP address for unauthenticated requests.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per identity
  message: { error: "API rate limit exceeded. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,

  keyGenerator: (req: Request): string => {
    const authHeader = req.headers.authorization;

    // Rate limit by actual User Identity if logged in
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      return crypto.createHash("sha256").update(token).digest("hex");
    }

    // Fallback to IP address if guest
    const { ip } = req;
    const cleanIp = (ip || "unknown-ip").replace(/%.*$/, "");
    return `ip_${cleanIp}`;
  },
});
