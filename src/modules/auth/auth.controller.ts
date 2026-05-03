import type { Request, Response } from "express";
import { env } from "../../config/env";
import { logInfo } from "../../utils/log";
import { REFRESH_COOKIE_NAME, REFRESH_TOKEN_MAX_AGE_MS } from "../../utils/jwt";
import { loginUser, logoutUserSession, refreshUserSession, registerUser } from "./auth.service";

const refreshCookieOptions = {
  httpOnly: true,
  maxAge: REFRESH_TOKEN_MAX_AGE_MS,
  path: "/auth",
  sameSite: "lax" as const,
  secure: env.NODE_ENV === "production",
};

const clearRefreshCookieOptions = {
  httpOnly: true,
  path: "/auth",
  sameSite: "lax" as const,
  secure: env.NODE_ENV === "production",
};

function setRefreshCookie(res: Response, refreshToken: string) {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, clearRefreshCookieOptions);
}

export async function register(req: Request, res: Response) {
  logInfo("Register request received", { email: req.body.email });
  const session = await registerUser(req.body);
  setRefreshCookie(res, session.refreshToken);
  logInfo("Register response sent", { userId: session.user.id, email: session.user.email });
  res.status(201).json({ accessToken: session.accessToken, user: session.user });
}

export async function login(req: Request, res: Response) {
  logInfo("Login request received", { email: req.body.email });
  const session = await loginUser(req.body);
  setRefreshCookie(res, session.refreshToken);
  logInfo("Login response sent", { userId: session.user.id, email: session.user.email });
  res.json({ accessToken: session.accessToken, user: session.user });
}

export async function refresh(req: Request, res: Response) {
  logInfo("Refresh request received", {
    hasRefreshCookie: Boolean(req.cookies?.[REFRESH_COOKIE_NAME]),
  });
  const session = await refreshUserSession(req.cookies?.[REFRESH_COOKIE_NAME]);
  setRefreshCookie(res, session.refreshToken);
  logInfo("Refresh response sent");
  res.json({ accessToken: session.accessToken });
}

export async function logout(req: Request, res: Response) {
  logInfo("Logout request received", {
    hasRefreshCookie: Boolean(req.cookies?.[REFRESH_COOKIE_NAME]),
  });
  await logoutUserSession(req.cookies?.[REFRESH_COOKIE_NAME]);
  clearRefreshCookie(res);
  logInfo("Logout response sent");
  res.status(204).send();
}
