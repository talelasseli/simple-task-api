import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import type { AuthResponse, Task } from "./types/api";

const apiMocks = vi.hoisted(() => ({
  createTask: vi.fn(),
  deleteTask: vi.fn(),
  getTasks: vi.fn(),
  loginUser: vi.fn(),
  logoutUser: vi.fn(),
  registerUser: vi.fn(),
  updateTask: vi.fn(),
}));

vi.mock("./lib/api", () => apiMocks);

const session: AuthResponse = {
  accessToken: "access-token",
  user: {
    createdAt: "2026-01-01T00:00:00.000Z",
    email: "user@example.com",
    id: "1974df31-a9d7-4ee0-b730-296d16f2ac2d",
  },
};

const task: Task = {
  completed: false,
  createdAt: "2026-01-02T00:00:00.000Z",
  id: "8dcec153-7202-4f2d-9bf0-a147b3b9c11d",
  title: "Build the frontend",
  userId: session.user.id,
};

function setRoute(path: string) {
  window.history.pushState({}, "", path);
}

function storeSession() {
  localStorage.setItem("task-tracker-session", JSON.stringify(session));
}

describe("App", () => {
  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    setRoute("/");
  });

  it("redirects unauthenticated users to the login page", async () => {
    setRoute("/tasks");

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Log in" })).toBeInTheDocument();
  });

  it("logs in and navigates to the task dashboard", async () => {
    apiMocks.loginUser.mockResolvedValue(session);
    apiMocks.getTasks.mockResolvedValue([]);
    const user = userEvent.setup();
    setRoute("/login");

    render(<App />);

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByRole("heading", { name: "Your tasks" })).toBeInTheDocument();
    expect(apiMocks.loginUser).toHaveBeenCalledWith("user@example.com", "password123");
    expect(apiMocks.getTasks).toHaveBeenCalledWith("access-token");
  });

  it("creates and deletes tasks from the dashboard", async () => {
    storeSession();
    apiMocks.getTasks.mockResolvedValue([]);
    apiMocks.createTask.mockResolvedValue(task);
    apiMocks.deleteTask.mockResolvedValue(undefined);
    const user = userEvent.setup();
    setRoute("/tasks");

    render(<App />);

    await screen.findByText("No tasks yet");
    await user.type(screen.getByLabelText("New task"), "Build the frontend");
    await user.click(screen.getByRole("button", { name: "Add task" }));

    expect(await screen.findByText("Build the frontend")).toBeInTheDocument();
    expect(apiMocks.createTask).toHaveBeenCalledWith("access-token", "Build the frontend");

    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(screen.queryByText("Build the frontend")).not.toBeInTheDocument();
    });
    expect(apiMocks.deleteTask).toHaveBeenCalledWith("access-token", task.id);
  });
});
