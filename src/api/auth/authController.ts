/**
 * @file authController.ts
 * @desc Handles HTTP requests for user authentication, registration, and session management.
 */

import { Request, Response } from "express";
import { z } from "zod";
import * as authService from "./authService";
import * as userService from "../user/userService";
import { AuthRequest } from "../../middleware/authMiddleware";
import { cookieConfig } from "../../utils/cookieConfig";
import { IUser } from "../user/userModel";
import { asyncHandler } from "../../utils/asyncHandler";

// --- Zod Schemas (Exported so authRoutes.ts can use them in the middleware) ---
export const GoogleLoginSchema = z.object({
  idToken: z.string().min(1, "ID Token required"),
});
export const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
export const UpdateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .optional(),
  bio: z.string().optional(),
});

/**
 * @desc Formats a raw Mongoose User document into a safe JSON DTO.
 */
const formatUserResponse = (user: IUser) => ({
  _id: user._id.toString(),
  name: user.name,
  email: user.email,
  username: user.username,
  bio: user.profile?.bio,
  avatarUrl: user.profile?.avatarUrl,
});

/**
 * @desc Standardizes the HTTP response and cookie injection for auth flows.
 */
const sendAuthResponse = (
  res: Response,
  statusCode: number,
  user: IUser,
  accessToken: string,
  refreshToken: string,
  message: string,
) => {
  res
    .cookie("refreshToken", refreshToken, cookieConfig.refresh())
    .status(statusCode)
    .json({ message, accessToken, user: formatUserResponse(user) });
};

/**
 * @route POST /api/auth/register
 * @desc Registers a new user via email and password.
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name, username } = req.body;

  if (await userService.findUserByEmail(email))
    return res.status(400).json({ error: "User already exists" });
  if (await userService.findUserByUsername(username))
    return res.status(400).json({ error: "Username is already taken" });

  const hashedPassword = await authService.hashPassword(password);
  const user = await userService.createUser({
    name,
    email,
    username,
    password: hashedPassword,
  });

  if (!user) return res.status(500).json({ error: "Failed to create user" });

  const accessToken = authService.generateAccessToken(user._id.toString());
  const refreshToken = authService.generateRefreshToken(user._id.toString());
  await userService.saveRefreshToken(user._id.toString(), refreshToken);

  sendAuthResponse(
    res,
    201,
    user,
    accessToken,
    refreshToken,
    "Registration successful",
  );
});

/**
 * @route POST /api/auth/login
 * @desc Authenticates a user via email and password.
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await userService.findUserByEmailWithPassword(email);

  if (
    !user ||
    !user.password ||
    !(await authService.comparePasswords(password, user.password))
  ) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const accessToken = authService.generateAccessToken(user._id.toString());
  const refreshToken = authService.generateRefreshToken(user._id.toString());
  await userService.saveRefreshToken(user._id.toString(), refreshToken);

  sendAuthResponse(
    res,
    200,
    user,
    accessToken,
    refreshToken,
    "Login successful",
  );
});

/**
 * @route POST /api/auth/google-login
 * @desc Authenticates or registers a user via Google OAuth ID Token.
 */
export const googleLogin = asyncHandler(async (req: Request, res: Response) => {
  const payload = await authService.verifyGoogleToken(req.body.idToken);
  const user = await authService.findOrCreateGoogleUser(payload);

  const accessToken = authService.generateAccessToken(user._id.toString());
  const refreshToken = authService.generateRefreshToken(user._id.toString());
  await userService.saveRefreshToken(user._id.toString(), refreshToken);

  sendAuthResponse(
    res,
    200,
    user,
    accessToken,
    refreshToken,
    "Login successful",
  );
});

/**
 * @route POST /api/auth/refresh
 * @desc Issues a new Access Token using a valid HTTP-only Refresh Token cookie.
 */
export const refreshToken = asyncHandler(
  async (req: Request, res: Response) => {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ error: "Missing refresh token" });

    // SENIOR FIX: Catching token verification failure without breaking asyncHandler flow
    const decoded = await Promise.resolve()
      .then(() => authService.verifyRefreshToken(token))
      .catch(() => null);
    if (!decoded)
      return res.status(401).json({ error: "Invalid refresh token" });

    const user = await userService.findUserById(decoded.userId);
    if (!user || user.refreshToken !== token) {
      return res
        .status(401)
        .json({ error: "Invalid or expired refresh token session" });
    }

    res
      .status(200)
      .json({
        accessToken: authService.generateAccessToken(user._id.toString()),
      });
  },
);

/**
 * @route GET /api/auth/me
 * @desc Fetches the currently authenticated user's profile.
 */
export const getCurrentUser = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user?.userId)
      return res.status(401).json({ error: "Unauthorized" });

    const user = await userService.findUserById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json({ user: formatUserResponse(user) });
  },
);

/**
 * @route POST /api/auth/logout
 * @desc Clears the refresh token cookie and removes it from the database.
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;

  if (token) {
    // We don't care if it fails (already expired), we just want to attempt DB cleanup
    const decoded = await Promise.resolve()
      .then(() => authService.verifyRefreshToken(token))
      .catch(() => null);
    if (decoded) await userService.saveRefreshToken(decoded.userId, "");
  }

  res.clearCookie("refreshToken", cookieConfig.clear());
  res.status(200).json({ message: "Successfully logged out" });
});