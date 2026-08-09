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
import { clerkMiddleware } from "@clerk/express";

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

// 1. CORS FIRST (Must intercept OPTIONS preflight requests before all other middleware)
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  process.env.FRONTEND_URL, // e.g. https://writely.vercel.app
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.some((url) => origin.startsWith(url))) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true, // Crucial for Clerk headers & cookies
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 2. Security & Loggers
app.use(helmet()); // Sets 14+ security-focused HTTP headers
app.use(mongoSanitize()); // Prevents MongoDB operator injections
app.use(morgan("dev")); // HTTP request logging
app.use(compression()); // Response payload compression

// 3. Parsers & Clerk Authentication
app.use(express.json());
app.use(cookieParser());
app.use(clerkMiddleware()); // Now safely parses tokens after CORS is handled

// 4. Rate Limiting
app.use("/api", apiLimiter); // Protects /api routes from spam/DDoS

// 5. Domain Routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/characters", characterRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/profile", profileRoute);
app.use("/api/analytics", analyticsRoute);

// 6. Global Error Handler (Must be last)
app.use(errorHandler);

export default app;