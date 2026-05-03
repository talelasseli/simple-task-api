import type { ApiErrorBody, AuthResponse, Task } from "../types/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://localhost";

type RequestOptions = RequestInit & {
  accessToken?: string | null;
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function parseJson<T>(response: Response) {
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function request<T>(path: string, options: RequestOptions = {}) {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (options.accessToken) {
    headers.set("Authorization", `Bearer ${options.accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    let message = "Something went wrong";

    try {
      const body = await response.json() as ApiErrorBody;
      message = body.error ?? message;
    } catch {
      message = response.statusText || message;
    }

    throw new ApiError(response.status, message);
  }

  return parseJson<T>(response);
}

export function registerUser(email: string, password: string) {
  return request<AuthResponse>("/auth/register", {
    body: JSON.stringify({ email, password }),
    method: "POST",
  });
}

export function loginUser(email: string, password: string) {
  return request<AuthResponse>("/auth/login", {
    body: JSON.stringify({ email, password }),
    method: "POST",
  });
}

export function logoutUser() {
  return request<void>("/auth/logout", { method: "POST" });
}

export function getTasks(accessToken: string) {
  return request<Task[]>("/tasks", { accessToken });
}

export function createTask(accessToken: string, title: string) {
  return request<Task>("/tasks", {
    accessToken,
    body: JSON.stringify({ title }),
    method: "POST",
  });
}

export function updateTask(accessToken: string, taskId: string, title: string) {
  return request<Task>(`/tasks/${taskId}`, {
    accessToken,
    body: JSON.stringify({ title }),
    method: "PUT",
  });
}

export function deleteTask(accessToken: string, taskId: string) {
  return request<void>(`/tasks/${taskId}`, {
    accessToken,
    method: "DELETE",
  });
}
