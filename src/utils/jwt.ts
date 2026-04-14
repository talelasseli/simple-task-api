import jwt from "jsonwebtoken";

const JWT_SECRET = "supersecret"; // later move to .env

export function createToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}
