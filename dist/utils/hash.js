"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.comparePasswords = comparePasswords;
const bcrypt_1 = __importDefault(require("bcrypt"));
async function hashPassword(password) {
    return bcrypt_1.default.hash(password, 10);
}
async function comparePasswords(password, hash) {
    return bcrypt_1.default.compare(password, hash);
}
