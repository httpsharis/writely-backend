import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as authService from './authService';
import * as userService from '../user/userService';
import { AuthRequest } from '../../middleware/authMiddleware';

const GoogleLoginSchema = z.object({
    idToken: z.string().min(1, 'ID Token is required'),
});

export const googleLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const parsedData = GoogleLoginSchema.safeParse(req.body);
        if (!parsedData.success) {
            // Zod uses .issues, not .errors
            res.status(400).json({ error: parsedData.error.issues[0].message });
            return;
        }

        const payload = await authService.verifyGoogleToken(parsedData.data.idToken);
        const { email, name, sub: googleId } = payload;

        // Ensure email and googleId exist before querying the database
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
        // Used .toString() instead of 'as string'
        const accessToken = authService.generateAccessToken(user._id.toString());
        const refreshToken = authService.generateRefreshToken(user._id.toString());

        // Save the refresh token to the database
        await userService.saveRefreshToken(user._id.toString(), refreshToken);

        res.status(200).json({ 
            message: 'Login successful', 
            accessToken,
            refreshToken,
            user: { id: user._id, name: user.name, email: user.email } 
        });

    } catch (error) {
        next(error);
    }
};

// The endpoint to get a fresh access token
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { token } = req.body;

        if (!token) {
            res.status(400).json({ error: 'Refresh token is required' });
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
        // FIXED: Used .toString() instead of 'as string'
        const newAccessToken = authService.generateAccessToken(user._id.toString());

        res.status(200).json({ accessToken: newAccessToken });
    } catch (error) {
        res.status(401).json({ error: 'Invalid refresh token' });
    }
};

// FIXED: Renamed back to getCurrentUser to match authRoute.ts
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