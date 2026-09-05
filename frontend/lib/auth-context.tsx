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
    // Restore session from localStorage on mount
    const savedToken = localStorage.getItem("peoplepay_token");
    const savedUser = localStorage.getItem("peoplepay_user");

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("peoplepay_token");
        localStorage.removeItem("peoplepay_user");
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

    localStorage.setItem("peoplepay_token", access_token);
    localStorage.setItem("peoplepay_user", JSON.stringify(userData));
    localStorage.setItem("peoplepay_role", role);
    localStorage.setItem("peoplepay_name", `${first_name || ""} ${last_name || ""}`.trim() || res.data.email);

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

    localStorage.setItem("peoplepay_token", access_token);
    localStorage.setItem("peoplepay_user", JSON.stringify(userData));
    localStorage.setItem("peoplepay_role", role);
    localStorage.setItem("peoplepay_name", `${first_name || ""} ${last_name || ""}`.trim() || res.data.email);

    router.push("/");
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("peoplepay_token");
    localStorage.removeItem("peoplepay_user");
    localStorage.removeItem("peoplepay_role");
    localStorage.removeItem("peoplepay_name");
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
