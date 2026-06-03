import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as authService from './authService';
import * as userService from '../user/userService';
import { AuthRequest } from '../../middleware/authMiddleware';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import jwt from 'jsonwebtoken';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// 1. Ask Google if the frontend's token is legitimate
export const verifyGoogleToken = async (idToken: string): Promise<TokenPayload> => {
    const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub) {
        throw new Error('Invalid Google token payload');
    }

    return payload;
};

// 2. Generate short lived token (15 minutes)
export const generateAccessToken = (userId: string): string => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET as string,
        { expiresIn: '15m' }
    );
}

// Long Lived Token (30 days)
export const generateRefreshToken = (userId: string): string => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET as string,
        { expiresIn: '30d' }
    )
}

// Refresh Token Verification 
export const verifyRefreshToken = (token: string): { userId: string } => {
    return jwt.verify(
        token,
        process.env.JWT_SECRET as string
    ) as { userId: string }
}

const GoogleLoginSchema = z.object({
    idToken: z.string().min(1, 'ID Token is required'),
});

// TEMPORARY ROUTE FOR POSTMAN TESTING ONLY
export const postmanTestLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        let user = await userService.findUserByEmail('test@writely.com');
        if (!user) {
            user = await userService.createUser({
                name: 'Postman Tester',
                email: 'test@writely.com',
                googleId: 'fake-google-id-123'
            });
        }

        const accessToken = authService.generateAccessToken(user._id.toString());
        const refreshToken = authService.generateRefreshToken(user._id.toString());

        // Attach secure cookie for Postman test as well
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000 
        });

        res.status(200).json({ 
            message: 'Bypass login successful', 
            accessToken,
            user: { id: user._id, name: user.name, email: user.email } 
        });
    } catch (error) {
        next(error);
    }
};

export const googleLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const parsedData = GoogleLoginSchema.safeParse(req.body);
        if (!parsedData.success) {
            res.status(400).json({ error: parsedData.error.issues[0].message });
            return;
        }

        const payload = await authService.verifyGoogleToken(parsedData.data.idToken);
        const { email, name, sub: googleId } = payload;

        if (!email || !googleId) {
            res.status(400).json({ error: 'Invalid token payload' });
            return;
        }

        let user = await userService.findUserByEmail(email);

        if (!user) {
            user = await userService.createUser({
                name: name || 'Writely User',
                email,
                googleId
            });
        }

        // Generate BOTH tokens
        const accessToken = authService.generateAccessToken(user._id.toString());
        const refreshToken = authService.generateRefreshToken(user._id.toString());

        // Save the refresh token to the database
        await userService.saveRefreshToken(user._id.toString(), refreshToken);

        // --- SECURITY FIX: Set the httpOnly cookie ---
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true, // Blocks JavaScript from reading the token
            secure: process.env.NODE_ENV === 'production', // Requires HTTPS in production
            sameSite: 'strict', // Prevents CSRF attacks
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 Days
        });

        // --- SECURITY FIX: Send ONLY the accessToken in JSON ---
        res.status(200).json({ 
            message: 'Login successful', 
            accessToken,
            user: { id: user._id, name: user.name, email: user.email } 
        });

    } catch (error) {
        next(error);
    }
};

// The endpoint to get a fresh access token
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // --- SECURITY FIX: Read the token from the secure cookie, not req.body ---
        const token = req.cookies?.refreshToken;

        if (!token) {
            res.status(401).json({ error: 'Refresh token is missing or expired' });
            return;
        }

        // 1. Check if the token is mathematically valid
        const decoded = authService.verifyRefreshToken(token);

        // 2. Look up the user
        const user = await userService.findUserById(decoded.userId);
        if (!user || user.refreshToken !== token) {
            res.status(401).json({ error: 'Invalid or expired refresh token' });
            return;
        }

        // 3. Generate a brand new access token
        const newAccessToken = authService.generateAccessToken(user._id.toString());

        res.status(200).json({ accessToken: newAccessToken });
    } catch (error) {
        res.status(401).json({ error: 'Invalid refresh token' });
    }
};

export const getCurrentUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const user = await userService.findUserById(userId);

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.status(200).json({ user });
    } catch (error) {
        next(error);
    }
};