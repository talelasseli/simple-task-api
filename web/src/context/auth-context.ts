import { createContext } from "react";
import type { User } from "../types/api";

export type AuthContextValue = {
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  user: User | null;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
