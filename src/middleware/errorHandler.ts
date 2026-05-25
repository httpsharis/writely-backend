import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(`[Error]: ${err.message}`);
    
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        error: err.message || 'Internal Server Error',
        // Only show the stack trace in development mode for security
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};