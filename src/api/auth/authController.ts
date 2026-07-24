import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as authService from "./authService";
import * as userService from "../user/userService";
import { AuthRequest } from "../../middleware/authMiddleware";
import { cookieConfig } from "../../utils/cookieConfig";

const GoogleLoginSchema = z.object({
  idToken: z.string().min(1, "ID Token required"),
});

const formatUserResponse = (user: any) => ({
  _id: user._id.toString(),
  name: user.name,
  email: user.email,
});

// ==========================================
// 1. DEVELOPMENT DUMMY LOGIN
// ==========================================
export const devDummyLogin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (process.env.NODE_ENV !== "development") {
    res.status(404).json({ error: "Route not found" });
    return;
  }

  try {
    let user = await userService.findUserByEmail("dev@writely.com");

    if (!user) {
      user = await userService.createUser({
        name: "Local Dev",
        email: "dev@writely.com",
        googleId: "dummy-dev-id",
      });
    }

    if (!user) {
      res.status(500).json({ error: "Failed to create dev user" });
      return;
    }

    const [accessToken, refreshToken] = [
      authService.generateAccessToken(user._id.toString()),
      authService.generateRefreshToken(user._id.toString()),
    ];

    await userService.saveRefreshToken(user._id.toString(), refreshToken);

    res
      .cookie("refreshToken", refreshToken, cookieConfig.refresh())
      .status(200)
      .json({
        message: "Dummy Dev Login successful",
        accessToken,
        user: formatUserResponse(user),
      });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. MAIN GOOGLE LOGIN
// ==========================================
export const googleLogin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parsed = GoogleLoginSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const {
      email,
      name,
      sub: googleId,
    } = await authService.verifyGoogleToken(parsed.data.idToken);

    if (!email || !googleId) {
      res.status(400).json({ error: "Invalid token payload" });
      return;
    }

    let user = await userService.findUserByEmail(email);

    if (!user) {
      user = await userService.createUser({
        name: name || "Writely User",
        email,
        googleId,
      });
    }

    if (!user) {
      res.status(500).json({ error: "Failed to create user" });
      return;
    }

    const [access, refresh] = [
      authService.generateAccessToken(user._id.toString()),
      authService.generateRefreshToken(user._id.toString()),
    ];

    await userService.saveRefreshToken(user._id.toString(), refresh);

    res
      .cookie("refreshToken", refresh, cookieConfig.refresh())
      .status(200)
      .json({
        message: "Login successful",
        accessToken: access,
        user: formatUserResponse(user),
      });
  } catch (error) {
    next(error);
  }
};

// REFRESH TOKEN
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      res.status(401).json({ error: "Missing refresh token" });
      return;
    }

    const decoded = authService.verifyRefreshToken(token);

    const user = await userService.findUserById(decoded.userId);
    if (!user || user.refreshToken !== token) {
      res
        .status(401)
        .json({ error: "Invalid or expired refresh token session" });
      return;
    }
    res.status(200).json({
      accessToken: authService.generateAccessToken(user._id.toString()),
    });
  } catch (error) {
    res.status(401).json({ error: "Invalid refresh token" });
  }
};

// GET CURRENT USER
export const getCurrentUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user?._id) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await userService.findUserById(req.user._id);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json({
      user: formatUserResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

// LOGOUT
export const logout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // 1. Remove the refresh token from the database if user is known
    if (req.user?._id) {
      await userService.saveRefreshToken(req.user._id.toString(), "");
    }

    // 2. Clear the HTTP-Only cookie so the browser deletes it
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/", // Must match the path used when setting the cookie!
    });

    res.status(200).json({ message: "Successfully logged out" });
  } catch (error) {
    next(error);
  }
};
