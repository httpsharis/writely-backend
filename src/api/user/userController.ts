import { Response } from 'express';
import { AuthRequest } from '../../middleware/authMiddleware'; // Make sure this is also camelCase now!
import * as userService from './userService';

export const getUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            res.status(400).json({ error: 'User ID missing from token' });
            return;
        }

        // 🟢 Notice how we just call the service here!
        const user = await userService.findUserById(userId);

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.status(200).json({ user });
    } catch (error) {
        console.error('Controller Error:', error);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
};