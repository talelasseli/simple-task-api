import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { logInfo } from "../../utils/log";
import * as service from "./task.service";

export async function getTasks(req: AuthRequest, res: Response) {
  logInfo("Get tasks request received", { userId: req.userId });
  const tasks = await service.getTasks(req.userId!);
  logInfo("Get tasks response sent", { userId: req.userId, taskCount: tasks.length });
  res.json(tasks);
}

export async function createTask(req: AuthRequest, res: Response) {
  logInfo("Create task request received", { userId: req.userId });
  const task = await service.createTask(req.userId!, req.body.title);
  logInfo("Create task response sent", { userId: req.userId, taskId: task.id });
  res.status(201).json(task);
}

export async function updateTask(req: AuthRequest, res: Response) {
  logInfo("Update task request received", { userId: req.userId, taskId: req.params.id });
  const task = await service.updateTask(req.params.id, req.userId!, req.body.title);
  logInfo("Update task response sent", { userId: req.userId, taskId: task.id });
  res.json(task);
}

export async function deleteTask(req: AuthRequest, res: Response) {
  logInfo("Delete task request received", { userId: req.userId, taskId: req.params.id });
  await service.deleteTask(req.params.id, req.userId!);
  logInfo("Delete task response sent", { userId: req.userId, taskId: req.params.id });
  res.status(204).send();
}

export async function getTask(req: AuthRequest, res: Response) {
  logInfo("Get task request received", { userId: req.userId, taskId: req.params.id });
  const task = await service.getTask(req.params.id, req.userId!);
  logInfo("Get task response sent", { userId: req.userId, taskId: task.id });
  res.json(task);
}
