import { prisma } from "../../config/prisma";
import { hashPassword, comparePasswords } from "../../utils/hash";
import { createToken } from "../../utils/jwt";

export async function registerUser(email: string, password: string) {
  const hashed = await hashPassword(password);

  const user = await prisma.user.create({
    data: { email, password: hashed },
  });

  return createToken(user.id);
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new Error("User not found");

  const valid = await comparePasswords(password, user.password);
  if (!valid) throw new Error("Invalid password");

  return createToken(user.id);
}
