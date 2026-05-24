import { Request, Response } from 'express';
import User from './userModel';

export const createTestUser = async (req: Request, res: Response) => {
    try {
        const newUser = await User.create({
            name: 'Test Founder',
            email: 'founder@writely.com',
            passwordHash: 'fake-hashed-password-123'
        });

        res.status(201).json({ message: 'User created perfectly via controller!', user: newUser });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create user' });
    }
};