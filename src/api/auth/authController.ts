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
// 0. TRADITIONAL EMAIL/PASSWORD LOGIN
// ==========================================
import bcrypt from "bcryptjs";

const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const { email, password, name } = parsed.data;

    let user = await userService.findUserByEmail(email);
    if (user) {
      res.status(400).json({ error: "User already exists" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = await userService.createUser({
      name,
      email,
      password: hashedPassword,
    });

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
      .status(201)
      .json({
        message: "Registration successful",
        accessToken: access,
        user: formatUserResponse(user),
      });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const { email, password } = parsed.data;

    // Use a custom query to include the password field since it is select: false
    const User = require("../user/userModel").default;
    const user = await User.findOne({ email }).select("+password");

    if (!user || !user.password) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ error: "Invalid credentials" });
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
    if (!req.user?.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await userService.findUserById(req.user.userId);

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
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // 1. Remove the refresh token from the database if provided
    const token = req.cookies?.refreshToken;
    if (token) {
      try {
        // Decode to find which user to clear the token for
        const decoded = authService.verifyRefreshToken(token);
        await userService.saveRefreshToken(decoded.userId, "");
      } catch (err) {
        // Token is invalid/expired, it's safe to ignore DB cleanup
      }
    }

    // 2. Clear the HTTP-Only cookie so the browser deletes it
    // Use cookieConfig.clear() so sameSite, secure, and path match exactly
    res.clearCookie("refreshToken", cookieConfig.clear());

    res.status(200).json({ message: "Successfully logged out" });
  } catch (error) {
    next(error);
  }
};
