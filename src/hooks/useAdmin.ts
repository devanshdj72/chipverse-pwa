// src/hooks/useAdmin.ts
// Global admin context — token persisted in localStorage, shared across all admin pages

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
  isSuperAdmin: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => void;
  authHeaders: () => Record<string, string>;
}

const AdminContext = createContext<AdminCtx>({
  token: null, admin: null, isLoggedIn: false, isSuperAdmin: false,
  login: async () => {}, logout: () => {},
  authHeaders: () => ({ "Content-Type": "application/json" }),
});

export function AdminProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(ADMIN_TOKEN_KEY)
  );
  const [admin, setAdmin] = useState<AdminInfo | null>(() => {
    try {
      const raw = localStorage.getItem(ADMIN_INFO_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  // Sync across tabs
  useEffect(() => {
    const handler = () => {
      setToken(localStorage.getItem(ADMIN_TOKEN_KEY));
      try {
        const raw = localStorage.getItem(ADMIN_INFO_KEY);
        setAdmin(raw ? JSON.parse(raw) : null);
      } catch { setAdmin(null); }
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

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token ?? localStorage.getItem(ADMIN_TOKEN_KEY) ?? ""}`,
  });

  return createElement(AdminContext.Provider, {
    value: { token, admin, isLoggedIn: !!token && !!admin, isSuperAdmin: admin?.role === "SUPER_ADMIN", login, logout, authHeaders }
  }, children);
}

export function useAdmin() {
  return useContext(AdminContext);
}
