import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { AppError } from "../errors/app-error";

type RequestField = "body" | "params" | "query";

function formatIssues(issues: Array<{ path: PropertyKey[]; message: string }>) {
  return issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}

function validate<T>(schema: ZodType<T>, field: RequestField): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req[field]);

    if (!result.success) {
      next(new AppError(400, `Invalid request ${field}`, formatIssues(result.error.issues)));
      return;
    }

    req[field] = result.data as never;
    next();
  };
}

export function validateBody<T>(schema: ZodType<T>): RequestHandler {
  return validate(schema, "body");
}

export function validateParams<T>(schema: ZodType<T>): RequestHandler {
  return validate(schema, "params");
}
