import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { setAuthTokenGetter } from "@/api-client";
import { queryClient } from "@/lib/query-client";

// Accounts are Baity accounts: the same /api/auth endpoints the Baity app uses.
// Baity Business is for account holders; household staff (workers, drivers)
// are refused by the API, and refused here before they get that far.

export interface AuthUser {
  id: number;
  email: string | null;
  name: string;
  role: "housewife" | "worker";
  language: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; language: string }) => Promise<void>;
  logout: () => void;
}

const TOKEN_KEY = "bb_token";

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Private mode: signed in for this tab only.
  }
}

let memoryToken: string | null = readToken();
setAuthTokenGetter(() => memoryToken);

/** An error whose message is safe to show the person. */
export class AuthError extends Error {
  constructor(
    message: string,
    public code: "invalid" | "exists" | "staff" | "validation" | "network",
  ) {
    super(message);
  }
}

async function postAuth(path: string, body: unknown): Promise<{ user: AuthUser; token: string }> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AuthError("network", "network");
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 409) throw new AuthError(data.error ?? "exists", "exists");
  if (res.status === 400) throw new AuthError(data.error ?? "validation", "validation");
  if (!res.ok) throw new AuthError(data.error ?? "invalid", "invalid");
  return data;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(!!memoryToken);

  const setSession = useCallback((token: string | null, next: AuthUser | null) => {
    memoryToken = token;
    writeToken(token);
    setUser(next);
    queryClient.clear();
  }, []);

  useEffect(() => {
    if (!memoryToken) return;
    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${memoryToken}` } })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("expired"))))
      .then((me) => {
        if (me.token) {
          memoryToken = me.token;
          writeToken(me.token);
        }
        if (me.role !== "housewife") throw new Error("staff");
        setUser(me);
      })
      .catch(() => setSession(null, null))
      .finally(() => setIsLoading(false));
  }, [setSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { user: u, token } = await postAuth("/api/auth/login", { email: email.trim(), password });
      if (u.role !== "housewife") throw new AuthError("staff", "staff");
      setSession(token, u);
    },
    [setSession],
  );

  const register = useCallback(
    async (data: { name: string; email: string; password: string; language: string }) => {
      const { user: u, token } = await postAuth("/api/auth/register", {
        ...data,
        name: data.name.trim(),
        email: data.email.trim(),
      });
      setSession(token, u);
    },
    [setSession],
  );

  const logout = useCallback(() => setSession(null, null), [setSession]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
