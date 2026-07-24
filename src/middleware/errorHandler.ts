/**
 * @file errorMiddleware.ts
 * @desc Global error catching middleware. Standardizes error responses
 * and safely hides stack traces in production environments.
 */
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  console.error(`[Error]: ${err.message}`);

  // Handle operational errors created by our application (e.g., NotFoundError)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // Handle unexpected programmatic errors (e.g., TypeError, DB Crash)
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    error: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};
