import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type AdminAuthContextValue = {
  isAdmin: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
};

const ADMIN_EMAIL = "admin123ecom@gmail.com";
const ADMIN_PASSWORD = "admin123@";
const STORAGE_KEY = "admin:auth";

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAdmin, setIsAdmin] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  });

  const login = (email: string, password: string) => {
    const success = email === ADMIN_EMAIL && password === ADMIN_PASSWORD;
    setIsAdmin(success);
    if (typeof window !== "undefined") {
      if (success) {
        window.localStorage.setItem(STORAGE_KEY, "true");
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    return success;
  };

  const logout = () => {
    setIsAdmin(false);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  const value = useMemo(() => ({ isAdmin, login, logout }), [isAdmin]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
};
