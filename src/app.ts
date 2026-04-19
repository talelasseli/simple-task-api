import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { errorMiddleware } from "./middlewares/error.middleware";
import authRoutes from "./modules/auth/auth.routes";
import taskRoutes from "./modules/tasks/task.routes";

const app = express();

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

app.use("/auth", authRoutes);
app.use("/tasks", taskRoutes);

app.get("/", (_req, res) => res.json({ status: "ok" }));

app.use(errorMiddleware);

export default app;
