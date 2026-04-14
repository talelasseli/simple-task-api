"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = registerUser;
exports.loginUser = loginUser;
const prisma_1 = require("../../config/prisma");
const hash_1 = require("../../utils/hash");
const jwt_1 = require("../../utils/jwt");
async function registerUser(email, password) {
    const hashed = await (0, hash_1.hashPassword)(password);
    const user = await prisma_1.prisma.user.create({
        data: { email, password: hashed },
    });
    return (0, jwt_1.createToken)(user.id);
}
async function loginUser(email, password) {
    const user = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (!user)
        throw new Error("User not found");
    const valid = await (0, hash_1.comparePasswords)(password, user.password);
    if (!valid)
        throw new Error("Invalid password");
    return (0, jwt_1.createToken)(user.id);
}
