import { prisma } from "../../config/prisma";

export async function getTasks(userId: string) {
  return prisma.task.findMany({ where: { userId } });
}

export async function createTask(userId: string, title: string) {
  return prisma.task.create({
    data: { title, userId },
  });
}

export async function updateTask(id: string, userId: string, title: string) {
  return prisma.task.updateMany({
    where: { id, userId },
    data: { title },
  });
}

export async function deleteTask(id: string, userId: string) {
  return prisma.task.deleteMany({
    where: { id, userId },
  });
}

export async function getTask(id: string, userId: string) {
  return prisma.task.findFirst({
    where: { id, userId },
  });
}
