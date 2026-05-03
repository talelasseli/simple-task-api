import type { ReactNode } from "react";
import { useState } from "react";
import { AuthContext } from "./auth-context";
import { loginUser, logoutUser, registerUser } from "../lib/api";
import type { AuthResponse, User } from "../types/api";

type StoredSession = {
  accessToken: string;
  user: User;
};

const STORAGE_KEY = "task-tracker-session";

function readStoredSession() {
  const rawSession = localStorage.getItem(STORAGE_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession) as StoredSession;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function persistSession(session: AuthResponse) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(() => readStoredSession());

  async function register(email: string, password: string) {
    const nextSession = await registerUser(email, password);
    persistSession(nextSession);
    setSession(nextSession);
  }

  async function login(email: string, password: string) {
    const nextSession = await loginUser(email, password);
    persistSession(nextSession);
    setSession(nextSession);
  }

  async function logout() {
    try {
      await logoutUser();
    } finally {
      localStorage.removeItem(STORAGE_KEY);
      setSession(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        accessToken: session?.accessToken ?? null,
        isAuthenticated: Boolean(session?.accessToken),
        login,
        logout,
        register,
        user: session?.user ?? null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
