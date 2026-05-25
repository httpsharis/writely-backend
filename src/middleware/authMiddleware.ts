import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend the Express Request to include our custom user data
export interface AuthRequest extends Request {
  user?: { userId: string };
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction): void => {
  let token;

  // Check if the authorization header exists and starts with 'Bearer'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({ error: 'Not authorized, no token provided' });
    return;
  }

  try {
    // Verify the token using your secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
    
    // Attach the user ID to the request so the controller knows exactly who is making the request
    req.user = decoded;
    
    // Move on to the actual controller
    next();
  } catch (error) {
    res.status(401).json({ error: 'Not authorized, token failed' });
  }
};