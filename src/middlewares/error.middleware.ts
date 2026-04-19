import type { ErrorRequestHandler } from "express";
import { AppError } from "../errors/app-error";

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    const body = error.details
      ? { error: error.message, details: error.details }
      : { error: error.message };

    res.status(error.statusCode).json(body);
    return;
  }

  console.error(error);
  res.status(500).json({ error: "Internal server error" });
};
