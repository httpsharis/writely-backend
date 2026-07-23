import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

/**
 * @desc Validates the request body against a Zod schema. 
 * Replaces req.body with the sanitized/stripped data.
 */
export const validateRequest = (schema: z.ZodSchema) => 
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // parseAsync strips out any malicious extra fields not in the schema
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: error.issues[0].message });
        return;
      }
      next(error);
    }
  };