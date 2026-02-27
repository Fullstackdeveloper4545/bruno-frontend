import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type UserAuthContextValue = {
  isLoggedIn: boolean;
  email: string | null;
  login: (email: string) => void;
  logout: () => void;
};

const STORAGE_KEY = "user:auth";

type StoredAuth = {
  email: string;
};

const readStoredEmail = () => {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<StoredAuth>;
    return typeof parsed.email === "string" ? parsed.email : null;
  } catch {
    return null;
  }
};

const UserAuthContext = createContext<UserAuthContextValue | undefined>(undefined);

export const UserAuthProvider = ({ children }: { children: ReactNode }) => {
  const [email, setEmail] = useState<string | null>(() => readStoredEmail());

  const login = (nextEmail: string) => {
    const trimmed = nextEmail.trim();
    if (!trimmed) {
      return;
    }
    setEmail(trimmed);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ email: trimmed }));
    }
  };

  const logout = () => {
    setEmail(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  const value = useMemo(
    () => ({ isLoggedIn: Boolean(email), email, login, logout }),
    [email],
  );

  return <UserAuthContext.Provider value={value}>{children}</UserAuthContext.Provider>;
};

export const useUserAuth = () => {
  const context = useContext(UserAuthContext);
  if (!context) {
    throw new Error("useUserAuth must be used within a UserAuthProvider");
  }
  return context;
};
