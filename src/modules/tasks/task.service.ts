import { prisma } from "../../config/prisma";
import { AppError } from "../../errors/app-error";

export async function getTasks(userId: string) {
  return prisma.task.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createTask(userId: string, title: string) {
  return prisma.task.create({
    data: { title, userId },
  });
}

export async function updateTask(id: string, userId: string, title: string) {
  const existingTask = await prisma.task.findFirst({
    where: { id, userId },
  });

  if (!existingTask) {
    throw new AppError(404, "Task not found");
  }

  return prisma.task.update({
    where: { id: existingTask.id },
    data: { title },
  });
}

export async function deleteTask(id: string, userId: string) {
  const existingTask = await prisma.task.findFirst({
    where: { id, userId },
  });

  if (!existingTask) {
    throw new AppError(404, "Task not found");
  }

  await prisma.task.delete({ where: { id: existingTask.id } });
}

export async function getTask(id: string, userId: string) {
  const task = await prisma.task.findFirst({
    where: { id, userId },
  });

  if (!task) {
    throw new AppError(404, "Task not found");
  }

  return task;
}
