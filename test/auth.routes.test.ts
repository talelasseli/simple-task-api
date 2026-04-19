import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../src/errors/app-error";

const authServiceMocks = vi.hoisted(() => ({
  loginUser: vi.fn(),
  logoutUserSession: vi.fn(),
  refreshUserSession: vi.fn(),
  registerUser: vi.fn(),
}));

vi.mock("../src/modules/auth/auth.service", () => authServiceMocks);

import app from "../src/app";

describe("auth routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers a user, returns an access token, and sets the refresh cookie", async () => {
    authServiceMocks.registerUser.mockResolvedValue({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      user: {
        id: "1974df31-a9d7-4ee0-b730-296d16f2ac2d",
        email: "user@example.com",
        createdAt: new Date("2025-01-01T00:00:00.000Z"),
      },
    });

    const response = await request(app)
      .post("/auth/register")
      .send({ email: "user@example.com", password: "password123" });

    expect(response.status).toBe(201);
    expect(response.body.accessToken).toBe("access-token");
    expect(authServiceMocks.registerUser).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "password123",
    });
    expect(response.headers["set-cookie"][0]).toContain("refreshToken=refresh-token");
    expect(response.headers["set-cookie"][0]).toContain("HttpOnly");
    expect(response.headers["set-cookie"][0]).toContain("Path=/auth");
  });

  it("rejects invalid registration payloads before hitting the service", async () => {
    const response = await request(app)
      .post("/auth/register")
      .send({ email: "bad-email", password: "short" });

    expect(response.status).toBe(400);
    expect(authServiceMocks.registerUser).not.toHaveBeenCalled();
  });

  it("returns a generic auth error for invalid login credentials", async () => {
    authServiceMocks.loginUser.mockRejectedValue(new AppError(401, "Invalid email or password"));

    const response = await request(app)
      .post("/auth/login")
      .send({ email: "user@example.com", password: "password123" });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Invalid email or password" });
  });

  it("rotates the refresh cookie on /auth/refresh", async () => {
    authServiceMocks.refreshUserSession.mockResolvedValue({
      accessToken: "next-access-token",
      refreshToken: "next-refresh-token",
    });

    const response = await request(app)
      .post("/auth/refresh")
      .set("Cookie", ["refreshToken=old-refresh-token"]);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ accessToken: "next-access-token" });
    expect(authServiceMocks.refreshUserSession).toHaveBeenCalledWith("old-refresh-token");
    expect(response.headers["set-cookie"][0]).toContain("refreshToken=next-refresh-token");
  });

  it("clears the refresh cookie on logout", async () => {
    authServiceMocks.logoutUserSession.mockResolvedValue(undefined);

    const response = await request(app)
      .post("/auth/logout")
      .set("Cookie", ["refreshToken=old-refresh-token"]);

    expect(response.status).toBe(204);
    expect(authServiceMocks.logoutUserSession).toHaveBeenCalledWith("old-refresh-token");
    expect(response.headers["set-cookie"][0]).toContain("refreshToken=");
  });
});
