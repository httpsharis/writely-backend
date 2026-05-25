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