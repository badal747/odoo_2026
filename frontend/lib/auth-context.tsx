"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export type UserRole =
  | "EMPLOYEE"
  | "HR_MANAGER"
  | "HR_PAYROLL_USER"
  | "HR_PAYROLL_MANAGER"
  | "ADMIN";

export interface AuthUser {
  user_id: string;
  email: string;
  role: UserRole;
  employee_id?: string | null;
  first_name?: string;
  last_name?: string;
}

export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: UserRole;
  department_id?: string;
  job_title?: string;
  phone?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Purge any legacy persistent localStorage to prevent automatic re-login across browser closes
    try {
      localStorage.removeItem("peoplepay_token");
      localStorage.removeItem("peoplepay_user");
      localStorage.removeItem("peoplepay_role");
      localStorage.removeItem("peoplepay_name");
    } catch {
      // Ignore if localStorage blocked
    }

    // Restore session ONLY from current active sessionStorage
    const savedToken = sessionStorage.getItem("peoplepay_token");
    const savedUser = sessionStorage.getItem("peoplepay_user");

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        sessionStorage.removeItem("peoplepay_token");
        sessionStorage.removeItem("peoplepay_user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    const { access_token, user_id, role, employee_id, first_name, last_name } = res.data;

    const userData: AuthUser = {
      user_id,
      email: res.data.email,
      role: role as UserRole,
      employee_id,
      first_name,
      last_name,
    };

    setToken(access_token);
    setUser(userData);

    // Save strictly to sessionStorage for current tab session only
    sessionStorage.setItem("peoplepay_token", access_token);
    sessionStorage.setItem("peoplepay_user", JSON.stringify(userData));
    sessionStorage.setItem("peoplepay_role", role);
    sessionStorage.setItem("peoplepay_name", `${first_name || ""} ${last_name || ""}`.trim() || res.data.email);

    router.push("/");
  };

  const register = async (data: RegisterData) => {
    const res = await api.post("/auth/register", data);
    const { access_token, user_id, role, employee_id, first_name, last_name } = res.data;

    const userData: AuthUser = {
      user_id,
      email: res.data.email,
      role: role as UserRole,
      employee_id,
      first_name,
      last_name,
    };

    setToken(access_token);
    setUser(userData);

    // Save strictly to sessionStorage for current tab session only
    sessionStorage.setItem("peoplepay_token", access_token);
    sessionStorage.setItem("peoplepay_user", JSON.stringify(userData));
    sessionStorage.setItem("peoplepay_role", role);
    sessionStorage.setItem("peoplepay_name", `${first_name || ""} ${last_name || ""}`.trim() || res.data.email);

    router.push("/");
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem("peoplepay_token");
    sessionStorage.removeItem("peoplepay_user");
    sessionStorage.removeItem("peoplepay_role");
    sessionStorage.removeItem("peoplepay_name");
    localStorage.removeItem("peoplepay_token");
    localStorage.removeItem("peoplepay_user");
    router.push("/login");
  };

  const hasRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    if (user.role === "ADMIN") return true;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
