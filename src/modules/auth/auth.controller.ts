import type { Request, Response } from "express";
import { env } from "../../config/env";
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
  const session = await registerUser(req.body);
  setRefreshCookie(res, session.refreshToken);
  res.status(201).json({ accessToken: session.accessToken, user: session.user });
}

export async function login(req: Request, res: Response) {
  const session = await loginUser(req.body);
  setRefreshCookie(res, session.refreshToken);
  res.json({ accessToken: session.accessToken, user: session.user });
}

export async function refresh(req: Request, res: Response) {
  const session = await refreshUserSession(req.cookies?.[REFRESH_COOKIE_NAME]);
  setRefreshCookie(res, session.refreshToken);
  res.json({ accessToken: session.accessToken });
}

export async function logout(req: Request, res: Response) {
  await logoutUserSession(req.cookies?.[REFRESH_COOKIE_NAME]);
  clearRefreshCookie(res);
  res.status(204).send();
}
