import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "7d";

const accessTokenPayloadSchema = z.object({
  userId: z.string().uuid(),
});

const refreshTokenPayloadSchema = accessTokenPayloadSchema.extend({
  sessionId: z.string().uuid(),
});

export const REFRESH_COOKIE_NAME = "refreshToken";
export const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export type AccessTokenPayload = z.infer<typeof accessTokenPayloadSchema>;
export type RefreshTokenPayload = z.infer<typeof refreshTokenPayloadSchema>;

export function createAccessToken(userId: string) {
  return jwt.sign({ userId }, env.JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

export function createRefreshToken(userId: string, sessionId: string) {
  return jwt.sign(
    { userId, sessionId },
    env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_TTL },
  );
}

export function verifyAccessToken(token: string) {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
  return accessTokenPayloadSchema.parse(payload);
}

export function verifyRefreshToken(token: string) {
  const payload = jwt.verify(token, env.JWT_REFRESH_SECRET);
  return refreshTokenPayloadSchema.parse(payload);
}
