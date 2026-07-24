/**
 * @file validateMiddleware.ts
 * @desc Intercepts incoming requests and validates the payload against a Zod schema.
 * Rejects bad data with a 400 error before it ever touches the controller.
 */
import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

/**
 * @param {z.ZodSchema} schema - The Zod schema to test req.body against.
 * @returns Express Middleware
 */
export const validateRequest =
  (schema: z.ZodSchema) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // parseAsync strips unapproved fields, protecting against NoSQL injection
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Send a clean, readable error message back to the frontend
        res.status(400).json({ error: error.issues[0].message });
        return;
      }
      next(error);
    }
  };
