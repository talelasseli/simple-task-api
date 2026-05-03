import type { ErrorRequestHandler } from "express";
import { AppError } from "../errors/app-error";
import { logError, logWarn } from "../utils/log";

export const errorMiddleware: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof AppError) {
    logWarn("Handled application error", {
      method: req.method,
      path: req.originalUrl,
      statusCode: error.statusCode,
      message: error.message,
      details: error.details,
    });

    const body = error.details
      ? { error: error.message, details: error.details }
      : { error: error.message };

    res.status(error.statusCode).json(body);
    return;
  }

  logError("Unhandled server error", {
    method: req.method,
    path: req.originalUrl,
    error,
  });
  res.status(500).json({ error: "Internal server error" });
};
