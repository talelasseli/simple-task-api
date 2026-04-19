import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { asyncHandler } from "../../middlewares/async-handler";
import { validateBody } from "../../middlewares/validate.middleware";
import { loginSchema, registerSchema } from "./auth.schema";
import { login, logout, refresh, register } from "./auth.controller";

const router = Router();

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many registration attempts, please try again later." },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts, please try again later." },
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many refresh attempts, please try again later." },
});

router.post("/register", registerLimiter, validateBody(registerSchema), asyncHandler(register));
router.post("/login", loginLimiter, validateBody(loginSchema), asyncHandler(login));
router.post("/refresh", refreshLimiter, asyncHandler(refresh));
router.post("/logout", asyncHandler(logout));

export default router;
