import { prisma } from "../../config/prisma";
import { AppError } from "../../errors/app-error";
import { logInfo, logWarn } from "../../utils/log";

export async function getTasks(userId: string) {
  logInfo("Task list query started", { userId });

  const tasks = await prisma.task.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  logInfo("Task list query completed", { userId, taskCount: tasks.length });

  return tasks;
}

export async function createTask(userId: string, title: string) {
  logInfo("Task create query started", { userId });

  const task = await prisma.task.create({
    data: { title, userId },
  });

  logInfo("Task create query completed", { userId, taskId: task.id });

  return task;
}

export async function updateTask(id: string, userId: string, title: string) {
  logInfo("Task update lookup started", { userId, taskId: id });

  const existingTask = await prisma.task.findFirst({
    where: { id, userId },
  });

  if (!existingTask) {
    logWarn("Task update rejected: task not found", { userId, taskId: id });
    throw new AppError(404, "Task not found");
  }

  logInfo("Task update query started", { userId, taskId: existingTask.id });

  const task = await prisma.task.update({
    where: { id: existingTask.id },
    data: { title },
  });

  logInfo("Task update query completed", { userId, taskId: task.id });

  return task;
}

export async function deleteTask(id: string, userId: string) {
  logInfo("Task delete lookup started", { userId, taskId: id });

  const existingTask = await prisma.task.findFirst({
    where: { id, userId },
  });

  if (!existingTask) {
    logWarn("Task delete rejected: task not found", { userId, taskId: id });
    throw new AppError(404, "Task not found");
  }

  await prisma.task.delete({ where: { id: existingTask.id } });

  logInfo("Task delete query completed", { userId, taskId: existingTask.id });
}

export async function getTask(id: string, userId: string) {
  logInfo("Task read query started", { userId, taskId: id });

  const task = await prisma.task.findFirst({
    where: { id, userId },
  });

  if (!task) {
    logWarn("Task read rejected: task not found", { userId, taskId: id });
    throw new AppError(404, "Task not found");
  }

  logInfo("Task read query completed", { userId, taskId: task.id });

  return task;
}
