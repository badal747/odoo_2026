"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useAuth, UserRole } from "@/lib/auth-context";

// Permitted roles per route path according to PDF Page 3 (Section 3: User Roles)
const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  "/payroll": ["ADMIN", "HR_PAYROLL_MANAGER", "HR_PAYROLL_USER"],
  "/contracts": ["ADMIN", "HR_MANAGER", "HR_PAYROLL_MANAGER", "HR_PAYROLL_USER"],
  "/schedules": ["ADMIN", "HR_MANAGER", "HR_PAYROLL_MANAGER", "HR_PAYROLL_USER"],
  "/config": ["ADMIN", "HR_PAYROLL_MANAGER", "HR_PAYROLL_USER"],
  "/employees": ["ADMIN", "HR_MANAGER", "HR_PAYROLL_MANAGER", "HR_PAYROLL_USER"],
};

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isAuthPage = pathname === "/login" || pathname === "/register";

  useEffect(() => {
    if (!loading) {
      if (!user && !isAuthPage) {
        router.replace("/login");
      } else if (user && isAuthPage) {
        router.replace("/");
      }
    }
  }, [user, loading, isAuthPage, router]);

  // While checking session on mount
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center font-black text-base shadow-sm animate-pulse">
            P
          </div>
          <div className="text-xs font-semibold text-slate-400">
            Validating Session...
          </div>
        </div>
      </div>
    );
  }

  // If already authenticated and visiting /login or /register, return null while redirecting to /
  if (user && isAuthPage) {
    return null;
  }

  // Allow unrestricted access to /login and /register for unauthenticated users
  if (!user && isAuthPage) {
    return <>{children}</>;
  }

  // If unauthenticated and on protected route, return null while redirecting to /login
  if (!user) {
    return null;
  }

  // Check route-level permissions
  const matchingPrefix = Object.keys(ROUTE_PERMISSIONS).find((route) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (matchingPrefix) {
    const allowedRoles = ROUTE_PERMISSIONS[matchingPrefix];
    const isPermitted = user.role === "ADMIN" || allowedRoles.includes(user.role);

    if (!isPermitted) {
      return (
        <div className="max-w-lg mx-auto mt-16 p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">403 Forbidden: Access Restricted</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            According to the PeoplePay360 security policy, your assigned role (<b className="text-slate-900">{user.role}</b>) does not possess permission to access this module.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-black hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Permitted Dashboard</span>
            </Link>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
