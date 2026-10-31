import type { AuthUser } from "@gametracker/shared";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, ApiError } from "./api";

type Auth = {
  user: AuthUser | null;
  ready: boolean;
  login: (login: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<Auth | null>(null);

// Who is signed in, read once at launch from the session cookie the system kept.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api<{ user: AuthUser }>("/auth/me")
      .then((payload) => setUser(payload.user))
      .catch((error: unknown) => {
        if (!(error instanceof ApiError && error.status === 401)) console.warn("Session check failed", error);
      })
      .finally(() => setReady(true));
  }, []);

  const login = useCallback(async (loginName: string, password: string) => {
    const payload = await api<{ user: AuthUser }>("/auth/login", { method: "POST", body: { login: loginName, password } });
    setUser(payload.user);
  }, []);

  const logout = useCallback(async () => {
    await api("/auth/logout", { method: "POST" }).catch(() => undefined);
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, ready, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): Auth {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth outside AuthProvider");
  return auth;
}
