import { z } from "zod";

const titleSchema = z.string().trim().min(1, "Title is required").max(200, "Title is too long");

export const taskParamsSchema = z.object({
  id: z.string().uuid("Task id must be a valid UUID"),
});

export const createTaskSchema = z.object({
  title: titleSchema,
});

export const updateTaskSchema = createTaskSchema;
