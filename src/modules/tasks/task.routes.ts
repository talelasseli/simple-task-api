import { Router } from "express";
import * as controller from "./task.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../middlewares/async-handler";
import { validateBody, validateParams } from "../../middlewares/validate.middleware";
import { createTaskSchema, taskParamsSchema, updateTaskSchema } from "./task.schema";

const router = Router();

router.use(authMiddleware);

router.get("/", asyncHandler(controller.getTasks));
router.post("/", validateBody(createTaskSchema), asyncHandler(controller.createTask));
router.get("/:id", validateParams(taskParamsSchema), asyncHandler(controller.getTask));
router.put(
  "/:id",
  validateParams(taskParamsSchema),
  validateBody(updateTaskSchema),
  asyncHandler(controller.updateTask),
);
router.delete("/:id", validateParams(taskParamsSchema), asyncHandler(controller.deleteTask));

export default router;
