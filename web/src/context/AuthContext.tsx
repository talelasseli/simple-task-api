import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { AuthContext } from "./auth-context";
import { loginUser, logoutUser, refreshUserSession, registerUser } from "../lib/api";
import { logError, logInfo } from "../lib/logger";
import type { AuthResponse, User } from "../types/api";

type StoredSession = {
  accessToken: string;
  user: User;
};

const STORAGE_KEY = "task-tracker-session";
const ACCESS_TOKEN_REFRESH_INTERVAL_MS = 14 * 60 * 1000;

function readStoredSession() {
  const rawSession = localStorage.getItem(STORAGE_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    const session = JSON.parse(rawSession) as StoredSession;
    logInfo("Stored session loaded", { userId: session.user.id, email: session.user.email });
    return session;
  } catch {
    logError("Stored session could not be parsed");
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function persistSession(session: AuthResponse) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  logInfo("Session persisted", { userId: session.user.id, email: session.user.email });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initialAuthState] = useState(() => {
    const storedSession = readStoredSession();

    return {
      session: storedSession,
      shouldRefreshImmediately: Boolean(storedSession),
    };
  });
  const [session, setSession] = useState<StoredSession | null>(initialAuthState.session);
  const shouldRefreshImmediately = useRef(initialAuthState.shouldRefreshImmediately);

  useEffect(() => {
    if (!session) {
      return;
    }

    let ignore = false;

    async function refreshSession() {
      try {
        const nextSession = await refreshUserSession();

        if (ignore) {
          return;
        }

        setSession((currentSession) => {
          if (!currentSession) {
            return currentSession;
          }

          const refreshedSession = {
            ...currentSession,
            accessToken: nextSession.accessToken,
          };

          localStorage.setItem(STORAGE_KEY, JSON.stringify(refreshedSession));
          logInfo("Session refresh completed", {
            userId: refreshedSession.user.id,
            email: refreshedSession.user.email,
          });

          return refreshedSession;
        });
      } catch (error) {
        if (ignore) {
          return;
        }

        logError("Session refresh failed", { error });
        localStorage.removeItem(STORAGE_KEY);
        setSession(null);
      }
    }

    if (shouldRefreshImmediately.current) {
      shouldRefreshImmediately.current = false;
      void refreshSession();
    }

    const intervalId = window.setInterval(refreshSession, ACCESS_TOKEN_REFRESH_INTERVAL_MS);

    return () => {
      ignore = true;
      window.clearInterval(intervalId);
    };
  }, [session?.user.id]);

  async function register(email: string, password: string) {
    logInfo("Auth register started", { email });

    try {
      const nextSession = await registerUser(email, password);
      persistSession(nextSession);
      setSession(nextSession);
      logInfo("Auth register completed", {
        userId: nextSession.user.id,
        email: nextSession.user.email,
      });
    } catch (error) {
      logError("Auth register failed", { email, error });
      throw error;
    }
  }

  async function login(email: string, password: string) {
    logInfo("Auth login started", { email });

    try {
      const nextSession = await loginUser(email, password);
      persistSession(nextSession);
      setSession(nextSession);
      logInfo("Auth login completed", {
        userId: nextSession.user.id,
        email: nextSession.user.email,
      });
    } catch (error) {
      logError("Auth login failed", { email, error });
      throw error;
    }
  }

  async function logout() {
    logInfo("Auth logout started", {
      userId: session?.user.id,
      email: session?.user.email,
    });

    try {
      await logoutUser();
      logInfo("Auth logout request completed");
    } catch (error) {
      logError("Auth logout request failed", { error });
    } finally {
      localStorage.removeItem(STORAGE_KEY);
      setSession(null);
      logInfo("Local session cleared");
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
