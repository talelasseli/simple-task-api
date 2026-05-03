import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/app-error";
import { logInfo, logWarn } from "../utils/log";
import { verifyAccessToken } from "../utils/jwt";

export interface AuthRequest extends Request {
  userId?: string;
}

export function authMiddleware(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    logWarn("Authorization failed: missing bearer token", {
      method: req.method,
      path: req.originalUrl,
    });
    next(new AppError(401, "Missing bearer token"));
    return;
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    logWarn("Authorization failed: malformed bearer token", {
      method: req.method,
      path: req.originalUrl,
    });
    next(new AppError(401, "Malformed bearer token"));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.userId;
    logInfo("Authorization succeeded", {
      method: req.method,
      path: req.originalUrl,
      userId: payload.userId,
    });
    next();
  } catch {
    logWarn("Authorization failed: invalid token", {
      method: req.method,
      path: req.originalUrl,
    });
    next(new AppError(401, "Invalid token"));
  }
}
