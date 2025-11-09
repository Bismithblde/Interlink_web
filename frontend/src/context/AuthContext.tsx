/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SupabaseSession, SupabaseUser } from "../types/user";

type AuthContextValue = {
  user: SupabaseUser | null;
  session: SupabaseSession | null;
  isAuthenticated: boolean;
  login: (user: SupabaseUser, session?: SupabaseSession | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "interlink.auth.user";
const SESSION_STORAGE_KEY = "interlink.auth.session";

const readStoredUser = (): SupabaseUser | null => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SupabaseUser;
  } catch (error) {
    console.warn("[AuthContext] Failed to read stored user", error);
    return null;
  }
};

const readStoredSession = (): SupabaseSession | null => {
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      session?: SupabaseSession | null;
    };
    return parsed?.session ?? null;
  } catch (error) {
    console.warn("[AuthContext] Failed to read stored session", error);
    return null;
  }
};

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SupabaseUser | null>(() => {
    if (typeof window === "undefined") return null;
    return readStoredUser();
  });
  const [session, setSession] = useState<SupabaseSession | null>(() => {
    if (typeof window === "undefined") return null;
    return readStoredSession();
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (user) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (session) {
      window.localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({
          user,
          session,
          storedAt: new Date().toISOString(),
        })
      );
    } else {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [session, user]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        setUser(event.newValue ? JSON.parse(event.newValue) : null);
        return;
      }
      if (event.key === SESSION_STORAGE_KEY) {
        if (!event.newValue) {
          setSession(null);
          return;
        }
        try {
          const parsed = JSON.parse(event.newValue) as {
            session?: SupabaseSession | null;
          };
          setSession(parsed?.session ?? null);
        } catch (error) {
          console.warn("[AuthContext] Failed to parse stored session", error);
          setSession(null);
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const login = (
    nextUser: SupabaseUser,
    nextSession?: SupabaseSession | null
  ) => {
    setUser(nextUser);
    if (nextSession !== undefined) {
      setSession(nextSession ?? null);
    }
  };

  const logout = () => {
    setUser(null);
    setSession(null);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
      } catch (error) {
        console.warn("[AuthContext] Failed to clear stored session", error);
      }
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      isAuthenticated: Boolean(user),
      login,
      logout,
    }),
    [session, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export { AuthProvider, useAuth };

