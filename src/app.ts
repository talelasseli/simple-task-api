import crypto from "node:crypto";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { errorMiddleware } from "./middlewares/error.middleware";
import authRoutes from "./modules/auth/auth.routes";
import taskRoutes from "./modules/tasks/task.routes";
import { logInfo } from "./utils/log";

const app = express();

app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    credentials: true,
    origin: env.CORS_ORIGINS.length > 0 ? env.CORS_ORIGINS : false,
  }),
);
app.use(cookieParser());
app.use(express.json());

app.use((req, res, next) => {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();

  logInfo("Request started", {
    requestId,
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  res.on("finish", () => {
    logInfo("Request finished", {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
    });
  });

  next();
});

app.use("/auth", authRoutes);
app.use("/tasks", taskRoutes);

app.get("/", (_req, res) => res.json({ status: "ok" }));

app.use(errorMiddleware);

export default app;
