import { OAuth2Client, TokenPayload } from 'google-auth-library';
import jwt from 'jsonwebtoken';

// 1. Strict Payload Interface
export interface AuthJwtPayload extends jwt.JwtPayload {
    userId: string;
}

// 2. Safe Environment Variable Extractor
const getEnv = (key: string): string => {
    const value = process.env[key];
    if (!value) throw new Error(`FATAL: Environment variable ${key} is missing.`);
    return value;
};

const client = new OAuth2Client(getEnv('GOOGLE_CLIENT_ID'));

// 3. Verify Google Token
export const verifyGoogleToken = async (idToken: string): Promise<TokenPayload> => {
    const ticket = await client.verifyIdToken({
        idToken,
        audience: getEnv('GOOGLE_CLIENT_ID'),
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub) {
        throw new Error('Invalid Google token payload');
    }

    return payload;
};

// 4. Generate Short-Lived Access Token (15 minutes)
export const generateAccessToken = (userId: string): string => {
    return jwt.sign(
        { userId },
        getEnv('JWT_ACCESS_SECRET'), // Use a dedicated access secret
        { expiresIn: '15m' }
    );
};

// 5. Generate Long-Lived Refresh Token (30 days)
export const generateRefreshToken = (userId: string): string => {
    return jwt.sign(
        { userId },
        getEnv('JWT_REFRESH_SECRET'), // Use a dedicated refresh secret
        { expiresIn: '30d' }
    );
};

// 6. Refresh Token Verification
export const verifyRefreshToken = (token: string): AuthJwtPayload => {
    return jwt.verify(
        token,
        getEnv('JWT_REFRESH_SECRET')
    ) as AuthJwtPayload;
};