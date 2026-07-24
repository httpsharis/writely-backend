import { Request, Response, NextFunction } from "express";

/**
 * Wraps async Express routes to automatically catch errors and pass them to the global error handler.
 * Eliminates the need for try/catch blocks in every controller.
 */
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};