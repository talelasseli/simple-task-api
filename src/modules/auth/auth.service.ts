import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { hashPassword, comparePasswords } from "../../utils/hash";
import { prisma } from "../../config/prisma";
import { AppError } from "../../errors/app-error";
import { logInfo, logWarn } from "../../utils/log";
import {
  createAccessToken,
  createRefreshToken,
  REFRESH_TOKEN_MAX_AGE_MS,
  verifyRefreshToken,
} from "../../utils/jwt";
import type { LoginInput, RegisterInput } from "./auth.schema";

const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password";
const INVALID_REFRESH_MESSAGE = "Invalid refresh token";

function getRefreshExpiryDate() {
  return new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS);
}

function hashRefreshToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function sanitizeUser(user: { id: string; email: string; createdAt: Date }) {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
  };
}

async function createSession(user: { id: string }) {
  const sessionId = crypto.randomUUID();
  const refreshToken = createRefreshToken(user.id, sessionId);

  logInfo("Creating refresh session", { userId: user.id, sessionId });

  await prisma.refreshSession.create({
    data: {
      id: sessionId,
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: getRefreshExpiryDate(),
    },
  });

  logInfo("Refresh session created", { userId: user.id, sessionId });

  return refreshToken;
}

async function issueTokens(user: {
  id: string;
  email: string;
  createdAt: Date;
}) {
  const refreshToken = await createSession(user);

  return {
    accessToken: createAccessToken(user.id),
    refreshToken,
    user: sanitizeUser(user),
  };
}

export async function registerUser({ email, password }: RegisterInput) {
  logInfo("Register service started", { email });
  const hashedPassword = await hashPassword(password);

  try {
    const user = await prisma.user.create({
      data: { email, password: hashedPassword },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    logInfo("User created", { userId: user.id, email: user.email });
    return issueTokens(user);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      logWarn("Register service rejected duplicate email", { email });
      throw new AppError(409, "Email is already registered");
    }

    throw error;
  }
}

export async function loginUser({ email, password }: LoginInput) {
  logInfo("Login service started", { email });
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      createdAt: true,
    },
  });

  if (!user) {
    logWarn("Login service rejected unknown email", { email });
    throw new AppError(401, INVALID_CREDENTIALS_MESSAGE);
  }

  const validPassword = await comparePasswords(password, user.password);

  if (!validPassword) {
    logWarn("Login service rejected invalid password", { userId: user.id, email });
    throw new AppError(401, INVALID_CREDENTIALS_MESSAGE);
  }

  logInfo("Login service authenticated user", { userId: user.id, email });
  return issueTokens(user);
}

export async function refreshUserSession(refreshToken: string | undefined) {
  logInfo("Refresh service started", { hasRefreshToken: Boolean(refreshToken) });

  if (!refreshToken) {
    logWarn("Refresh service rejected missing token");
    throw new AppError(401, INVALID_REFRESH_MESSAGE);
  }

  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    logWarn("Refresh service rejected unverifiable token");
    throw new AppError(401, INVALID_REFRESH_MESSAGE);
  }

  logInfo("Refresh token verified", {
    userId: payload.userId,
    sessionId: payload.sessionId,
  });

  const session = await prisma.refreshSession.findUnique({
    where: { id: payload.sessionId },
  });

  if (
    !session ||
    session.userId !== payload.userId ||
    session.revokedAt ||
    session.expiresAt <= new Date() ||
    session.tokenHash !== hashRefreshToken(refreshToken)
  ) {
    logWarn("Refresh service rejected invalid session", {
      userId: payload.userId,
      sessionId: payload.sessionId,
      sessionFound: Boolean(session),
      revoked: Boolean(session?.revokedAt),
      expired: session ? session.expiresAt <= new Date() : undefined,
      userMismatch: session ? session.userId !== payload.userId : undefined,
    });
    throw new AppError(401, INVALID_REFRESH_MESSAGE);
  }

  const nextRefreshToken = createRefreshToken(payload.userId, session.id);

  logInfo("Rotating refresh session", {
    userId: payload.userId,
    sessionId: session.id,
  });

  await prisma.refreshSession.update({
    where: { id: session.id },
    data: {
      tokenHash: hashRefreshToken(nextRefreshToken),
      expiresAt: getRefreshExpiryDate(),
    },
  });

  logInfo("Refresh session rotated", {
    userId: payload.userId,
    sessionId: session.id,
  });

  return {
    accessToken: createAccessToken(payload.userId),
    refreshToken: nextRefreshToken,
  };
}

export async function logoutUserSession(refreshToken: string | undefined) {
  logInfo("Logout service started", { hasRefreshToken: Boolean(refreshToken) });

  if (!refreshToken) {
    logInfo("Logout service skipped: missing token");
    return;
  }

  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    logWarn("Logout service skipped: unverifiable token");
    return;
  }

  logInfo("Revoking refresh session", {
    userId: payload.userId,
    sessionId: payload.sessionId,
  });

  const result = await prisma.refreshSession.updateMany({
    where: {
      id: payload.sessionId,
      userId: payload.userId,
      tokenHash: hashRefreshToken(refreshToken),
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  logInfo("Refresh session revoke completed", {
    userId: payload.userId,
    sessionId: payload.sessionId,
    revokedCount: result.count,
  });
}

export type AuthTokens = Awaited<ReturnType<typeof registerUser>>;
