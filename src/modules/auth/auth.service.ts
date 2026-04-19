import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { hashPassword, comparePasswords } from "../../utils/hash";
import { prisma } from "../../config/prisma";
import { AppError } from "../../errors/app-error";
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

  await prisma.refreshSession.create({
    data: {
      id: sessionId,
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: getRefreshExpiryDate(),
    },
  });

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

    return issueTokens(user);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError(409, "Email is already registered");
    }

    throw error;
  }
}

export async function loginUser({ email, password }: LoginInput) {
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
    throw new AppError(401, INVALID_CREDENTIALS_MESSAGE);
  }

  const validPassword = await comparePasswords(password, user.password);

  if (!validPassword) {
    throw new AppError(401, INVALID_CREDENTIALS_MESSAGE);
  }

  return issueTokens(user);
}

export async function refreshUserSession(refreshToken: string | undefined) {
  if (!refreshToken) {
    throw new AppError(401, INVALID_REFRESH_MESSAGE);
  }

  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, INVALID_REFRESH_MESSAGE);
  }

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
    throw new AppError(401, INVALID_REFRESH_MESSAGE);
  }

  const nextRefreshToken = createRefreshToken(payload.userId, session.id);

  await prisma.refreshSession.update({
    where: { id: session.id },
    data: {
      tokenHash: hashRefreshToken(nextRefreshToken),
      expiresAt: getRefreshExpiryDate(),
    },
  });

  return {
    accessToken: createAccessToken(payload.userId),
    refreshToken: nextRefreshToken,
  };
}

export async function logoutUserSession(refreshToken: string | undefined) {
  if (!refreshToken) {
    return;
  }

  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    return;
  }

  await prisma.refreshSession.updateMany({
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
}

export type AuthTokens = Awaited<ReturnType<typeof registerUser>>;
