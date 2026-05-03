import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import app from "../src/app";
import { prisma } from "../src/config/prisma";

const testEmailDomain = "integration.test";

async function cleanupIntegrationData() {
  const users = await prisma.user.findMany({
    where: { email: { endsWith: `@${testEmailDomain}` } },
    select: { id: true },
  });
  const userIds = users.map((user) => user.id);

  if (userIds.length === 0) {
    return;
  }

  await prisma.task.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.refreshSession.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

function uniqueEmail(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}@${testEmailDomain}`;
}

async function registerUser(email = uniqueEmail("user")) {
  const response = await request(app)
    .post("/auth/register")
    .send({ email, password: "password123" });

  expect(response.status).toBe(201);

  return {
    accessToken: response.body.accessToken as string,
    email,
    userId: response.body.user.id as string,
  };
}

describe("api integration", () => {
  beforeEach(async () => {
    await cleanupIntegrationData();
  });

  afterAll(async () => {
    await cleanupIntegrationData();
    await prisma.$disconnect();
  });

  it("returns the health response from the real Express app", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("registers a user in Postgres and rejects duplicate emails", async () => {
    const email = uniqueEmail("duplicate");

    const firstResponse = await request(app)
      .post("/auth/register")
      .send({ email, password: "password123" });
    const secondResponse = await request(app)
      .post("/auth/register")
      .send({ email, password: "password123" });
    const user = await prisma.user.findUnique({ where: { email } });

    expect(firstResponse.status).toBe(201);
    expect(firstResponse.body.accessToken).toEqual(expect.any(String));
    expect(user).toMatchObject({ email });
    expect(user?.password).not.toBe("password123");
    expect(secondResponse.status).toBe(409);
    expect(secondResponse.body).toEqual({ error: "Email is already registered" });
  });

  it("logs in with the real hashed password and creates a refresh session", async () => {
    const email = uniqueEmail("login");
    const registered = await registerUser(email);

    const response = await request(app)
      .post("/auth/login")
      .send({ email, password: "password123" });
    const sessions = await prisma.refreshSession.findMany({
      where: { userId: registered.userId },
    });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({ id: registered.userId, email });
    expect(sessions).toHaveLength(2);
  });

  it("creates and lists real tasks for the authenticated user", async () => {
    const { accessToken, userId } = await registerUser(uniqueEmail("tasks"));

    const createResponse = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Write real integration tests" });
    const listResponse = await request(app)
      .get("/tasks")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toMatchObject({
      title: "Write real integration tests",
      completed: false,
      userId,
    });
    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0]).toMatchObject({
      id: createResponse.body.id,
      title: "Write real integration tests",
      userId,
    });
  });

  it("does not allow one user to read another user's task", async () => {
    const owner = await registerUser(uniqueEmail("owner"));
    const otherUser = await registerUser(uniqueEmail("other"));
    const createResponse = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ title: "Private task" });

    const response = await request(app)
      .get(`/tasks/${createResponse.body.id}`)
      .set("Authorization", `Bearer ${otherUser.accessToken}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Task not found" });
  });

  it("rotates and revokes a real refresh session", async () => {
    const email = uniqueEmail("session");
    const agent = request.agent(app);

    const registerResponse = await agent
      .post("/auth/register")
      .send({ email, password: "password123" });
    const refreshResponse = await agent.post("/auth/refresh");
    const logoutResponse = await agent.post("/auth/logout");
    const session = await prisma.refreshSession.findFirst({
      where: { userId: registerResponse.body.user.id },
    });

    expect(registerResponse.status).toBe(201);
    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body.accessToken).toEqual(expect.any(String));
    expect(logoutResponse.status).toBe(204);
    expect(session?.revokedAt).toBeInstanceOf(Date);
  });
});
