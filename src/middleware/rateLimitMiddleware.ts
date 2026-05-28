import { rateLimit } from 'express-rate-limit';
import * as crypto from 'crypto';
import { Request, Response } from 'express';

// 1. Strict IP-Based Limiter for Authentication (Brute Force Protection)
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Too many authentication attempts, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// 2. Identity-Based Limiter for API Routes (Prevents Shared-IP Blocking)
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: { error: 'API rate limit exceeded. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,

    validate: false,

    keyGenerator: (req: Request, res: Response): string => {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            return crypto.createHash('sha256').update(token).digest('hex');
        }

        const { ip } = req;
        const cleanIp = (ip || 'unknown-ip').replace(/%.*$/, '');
        return `ip_${cleanIp}`;
    }
});