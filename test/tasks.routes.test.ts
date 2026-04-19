import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../src/errors/app-error";
import { createAccessToken } from "../src/utils/jwt";

const taskServiceMocks = vi.hoisted(() => ({
  createTask: vi.fn(),
  deleteTask: vi.fn(),
  getTask: vi.fn(),
  getTasks: vi.fn(),
  updateTask: vi.fn(),
}));

vi.mock("../src/modules/tasks/task.service", () => taskServiceMocks);

import app from "../src/app";

describe("task routes", () => {
  const userId = "1974df31-a9d7-4ee0-b730-296d16f2ac2d";
  const token = createAccessToken(userId);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects requests without a bearer token", async () => {
    const response = await request(app).get("/tasks");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Missing bearer token" });
  });

  it("returns 400 for an invalid task id before hitting the service", async () => {
    const response = await request(app)
      .get("/tasks/not-a-uuid")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(taskServiceMocks.getTask).not.toHaveBeenCalled();
  });

  it("returns a task scoped to the authenticated user", async () => {
    taskServiceMocks.getTask.mockResolvedValue({
      id: "8dcec153-7202-4f2d-9bf0-a147b3b9c11d",
      title: "Ship auth hardening",
      completed: false,
      userId,
      createdAt: new Date("2025-01-01T00:00:00.000Z"),
    });

    const response = await request(app)
      .get("/tasks/8dcec153-7202-4f2d-9bf0-a147b3b9c11d")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(taskServiceMocks.getTask).toHaveBeenCalledWith(
      "8dcec153-7202-4f2d-9bf0-a147b3b9c11d",
      userId,
    );
    expect(response.body.title).toBe("Ship auth hardening");
  });

  it("returns 404 when a user requests a missing task", async () => {
    taskServiceMocks.getTask.mockRejectedValue(new AppError(404, "Task not found"));

    const response = await request(app)
      .get("/tasks/8dcec153-7202-4f2d-9bf0-a147b3b9c11d")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Task not found" });
  });

  it("returns 204 when deleting the current user's task", async () => {
    taskServiceMocks.deleteTask.mockResolvedValue(undefined);

    const response = await request(app)
      .delete("/tasks/8dcec153-7202-4f2d-9bf0-a147b3b9c11d")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(204);
    expect(taskServiceMocks.deleteTask).toHaveBeenCalledWith(
      "8dcec153-7202-4f2d-9bf0-a147b3b9c11d",
      userId,
    );
  });
});
