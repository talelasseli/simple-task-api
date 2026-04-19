import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import * as service from "./task.service";

export async function getTasks(req: AuthRequest, res: Response) {
  const tasks = await service.getTasks(req.userId!);
  res.json(tasks);
}

export async function createTask(req: AuthRequest, res: Response) {
  const task = await service.createTask(req.userId!, req.body.title);
  res.status(201).json(task);
}

export async function updateTask(req: AuthRequest, res: Response) {
  const task = await service.updateTask(req.params.id, req.userId!, req.body.title);
  res.json(task);
}

export async function deleteTask(req: AuthRequest, res: Response) {
  await service.deleteTask(req.params.id, req.userId!);
  res.status(204).send();
}

export async function getTask(req: AuthRequest, res: Response) {
  const task = await service.getTask(req.params.id, req.userId!);
  res.json(task);
}
