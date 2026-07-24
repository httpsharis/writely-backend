/**
 * @file authService.ts
 * @desc Handles core authentication business logic including JWT signing, Google OAuth, and hashing.
 */

import { OAuth2Client, TokenPayload } from "google-auth-library";
import jwt, { SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User, { IUser } from "../user/userModel";
import crypto from "crypto";

export interface AuthJwtPayload extends jwt.JwtPayload {
  userId: string;
}

const getEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`FATAL: Environment variable ${key} is missing.`);
  return value;
};

const GOOGLE_CLIENT_ID = getEnv("GOOGLE_CLIENT_ID");
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

/**
 * @desc DRY Factory function to generate tokens and satisfy strict TypeScript overloads.
 */
const signToken = (
  userId: string,
  secretEnv: string,
  expiryEnv: string,
  fallbackExp: string,
) =>
  jwt.sign({ userId }, getEnv(secretEnv), {
    expiresIn: (process.env[expiryEnv] ||
      fallbackExp) as SignOptions["expiresIn"],
  });

export const generateAccessToken = (userId: string) =>
  signToken(userId, "JWT_ACCESS_SECRET", "JWT_ACCESS_EXPIRATION", "15m");
export const generateRefreshToken = (userId: string) =>
  signToken(userId, "JWT_REFRESH_SECRET", "JWT_REFRESH_EXPIRATION", "30d");

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, getEnv("JWT_REFRESH_SECRET")) as AuthJwtPayload;

export const hashPassword = async (password: string) =>
  bcrypt.hash(password, await bcrypt.genSalt(10));

export const comparePasswords = async (
  password: string,
  hash: string,
): Promise<boolean> => bcrypt.compare(password, hash);

/**
 * @desc Verifies a Google OAuth ID Token against Google's servers.
 */
export const verifyGoogleToken = async (
  idToken: string,
): Promise<TokenPayload> => {
  const payload = (
    await client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID })
  ).getPayload();
  // Optional chaining cleanly replaces nested if-statements
  if (!payload?.email || !payload?.sub)
    throw new Error("Invalid Google token payload");
  return payload;
};

/**
 * @desc Finds an existing user via Google Email, or creates a new one with a guaranteed unique username.
 */
export const findOrCreateGoogleUser = async ({
  email,
  name,
  picture,
  sub: googleId,
}: TokenPayload): Promise<IUser> => {
  const user = await User.findOne({ email });

  if (!user) {
    // 1. Strip spaces and special characters from the Google name
    const baseUsername = (name || "user")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();

    // 2. Generate a random 6-character hex string (e.g., 'a1b2c3')
    const randomHex = crypto.randomBytes(3).toString("hex");

    // 3. Combine them for a guaranteed unique fallback username
    const uniqueUsername = `${baseUsername}_${randomHex}`;

    return User.create({
      name: name || "Writely User",
      email,
      username: uniqueUsername, // They can change this later!
      googleId,
      profile: { avatarUrl: picture },
    });
  }

  // Link account if they previously registered with an email/password
  if (!user.googleId) {
    user.googleId = googleId;
    if (picture && !user.profile?.avatarUrl)
      user.profile = { ...user.profile, avatarUrl: picture };
    await user.save();
  }

  return user;
};

export const findUserByEmailWithPassword = async (email: string) => {
  // .select("+password") explicitly asks MongoDB to return the hidden password field just for this login check
  return User.findOne({ email }).select("+password");
};
