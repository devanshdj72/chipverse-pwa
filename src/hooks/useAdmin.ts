// src/hooks/useAdmin.ts
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { createElement } from "react";

const ADMIN_TOKEN_KEY = "chipverse_admin_token";
const ADMIN_INFO_KEY  = "chipverse_admin_info";

export const API_BASE = "https://chipverse-backend.onrender.com";

export type AdminInfo = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "SUPER_ADMIN";
};

interface AdminCtx {
  token: string | null;
  admin: AdminInfo | null;
  isLoggedIn: boolean;
  isInitializing: boolean;
  isSuperAdmin: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => void;
  authHeaders: () => Record<string, string>;
}

const AdminContext = createContext<AdminCtx>({
  token: null, admin: null, isLoggedIn: false, isInitializing: true,
  isSuperAdmin: false, login: async () => {}, logout: () => {},
  authHeaders: () => ({ "Content-Type": "application/json" }),
});

function readAdminInfo(): AdminInfo | null {
  try {
    const r = localStorage.getItem(ADMIN_INFO_KEY);
    return r ? JSON.parse(r) : null;
  } catch { return null; }
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(ADMIN_TOKEN_KEY)
  );
  const [admin, setAdmin] = useState<AdminInfo | null>(readAdminInfo);
  // isInitializing: prevents auth guards from redirecting before first render completes
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // After mount, mark initialized — guards can now safely redirect
    setIsInitializing(false);
  }, []);

  // Sync state across browser tabs
  useEffect(() => {
    const handler = () => {
      setToken(localStorage.getItem(ADMIN_TOKEN_KEY));
      setAdmin(readAdminInfo());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");
    localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
    localStorage.setItem(ADMIN_INFO_KEY, JSON.stringify(data.admin));
    setToken(data.token);
    setAdmin(data.admin);
    return data;
  };

  const logout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_INFO_KEY);
    setToken(null);
    setAdmin(null);
  };

  const authHeaders = () => {
    const t = token ?? localStorage.getItem(ADMIN_TOKEN_KEY) ?? "";
    return { "Content-Type": "application/json", Authorization: `Bearer ${t}` };
  };

  return createElement(AdminContext.Provider, {
    value: {
      token, admin,
      isLoggedIn: !!token && !!admin,
      isInitializing,
      isSuperAdmin: admin?.role === "SUPER_ADMIN",
      login, logout, authHeaders,
    }
  }, children);
}

export function useAdmin() {
  return useContext(AdminContext);
}
