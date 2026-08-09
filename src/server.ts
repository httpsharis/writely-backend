/**
 * @file server.ts
 * @desc Entry point for the Node.js process. Validates environment variables,
 * boots the database connection, and starts the Express server.
 */
import "dotenv/config";
import { Server } from "http"; // Strict typing for the server
import mongoose from "mongoose";
import app from "./app";
import { connectDB } from "./config/db"; // Use our custom, optimized DB connector!

// 1. Fail-Fast Environment Variable Validation
const requiredEnvVars = [
  "CLERK_SECRET_KEY",
  "MONGODB_URI",
];

for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    console.error(`FATAL ERROR: Missing required env var: ${key}`);
    process.exit(1);
  }
}

const PORT = process.env.PORT || 4000;

let server: Server; // Replaced 'any' with explicit HTTP Server type

// 2. Boot Database and Server
connectDB()
  .then(() => {
    server = app.listen(PORT, () => {
      console.log(
        `Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}.`,
      );
    });
  })
  .catch((err) => {
    console.error("Application failed to start due to database error:", err);
    process.exit(1);
  });

// 3. Graceful Shutdown
// Ensures active connections and database writes are completed before the server terminates.
const gracefulShutdown = () => {
  console.log("Initiating graceful shutdown...");
  if (server) {
    server.close(() => {
      console.log("HTTP server closed safely.");
      mongoose.connection.close(false).then(() => {
        console.log("MongoDB connection closed safely.");
        process.exit(0);
      });
    });
  } else {
    process.exit(0);
  }
};

// Listen for termination signals (Ctrl+C, Docker/Vercel shutdowns)
process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
