import { CookieOptions } from 'express';

const isProduction = process.env.NODE_ENV === 'production';

// Base security settings required for all cookies
const baseCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
};

export const cookieConfig = {
    // 15 Minutes for Access Token (If you choose to store it in a cookie)
    access: (): CookieOptions => ({
        ...baseCookieOptions,
        maxAge: 15 * 60 * 1000, 
    }),
    
    // 30 Days for Refresh Token
    refresh: (): CookieOptions => ({
        ...baseCookieOptions,
        maxAge: 30 * 24 * 60 * 60 * 1000, 
    }),

    // Used in the Logout Controller to instantly destroy the cookie
    clear: (): CookieOptions => ({
        ...baseCookieOptions,
        maxAge: 0,
    }),
};