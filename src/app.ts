/**
 * @file app.ts
 * @desc Core Express application setup. Mounts all global middlewares,
 * security headers, rate limiters, and route domains.
 */
import express, { Application } from "express";
import cors from "cors";
import mongoSanitize from "express-mongo-sanitize";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";

// Middleware Imports
import { apiLimiter } from "./middleware/rateLimitMiddleware";
import { errorHandler } from "./middleware/errorHandler";

// Route Imports
import userRoutes from "./api/user/userRoute";
import authRoutes from "./api/auth/authRoute";
import documentRoutes from "./api/document/documentRoute";
import likeRoutes from "./api/like/likeRoute";
import characterRoutes from "./api/character/characterRoute";
import uploadRoutes from "./api/upload/uploadRoute";
import exportRoutes from "./api/export/exportRoute";
import noteRoutes from "./api/note/noteRoute";
import searchRoutes from "./api/search/searchRoute";
import profileRoute from "./api/profile/profileRoute";
import analyticsRoute from "./api/analytics/analyticsRoute";

const app: Application = express();

// 1. Parsers & Cookies
app.use(express.json());
app.use(cookieParser());

// 2. Performance & Logging
app.use(compression()); // Compresses JSON responses for optimized payload delivery
app.use(morgan("dev")); // HTTP request logging for monitoring traffic

// 3. Global Security Middleware
app.use(helmet()); // Sets 14+ security-focused HTTP headers
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true, // Allows HTTP-Only cookies to pass through
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(mongoSanitize()); // Prevents malicious MongoDB operator injections

// 4. Rate Limiting
app.use("/api", apiLimiter); // Protects all /api routes from spam/DDoS

// 5. Domain Routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes); // Auth uses its own stricter rate limiter internally
app.use("/api/documents", documentRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/characters", characterRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/profile", profileRoute);
app.use("/api/analytics", analyticsRoute);

// 6. Global Error Handler (Must be the last middleware)
app.use(errorHandler);

export default app;
