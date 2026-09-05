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

  useEffect(() => {
    if (!loading && !user && pathname !== "/login" && pathname !== "/register") {
      router.push("/login");
    }
  }, [user, loading, pathname, router]);

  // While checking session on mount
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-xs font-semibold text-slate-400 animate-pulse">
          Validating Security Credentials...
        </div>
      </div>
    );
  }

  // Allow unrestricted access to /login and /register
  if (pathname === "/login" || pathname === "/register") {
    return <>{children}</>;
  }

  // If unauthenticated, will redirect in useEffect, return null
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
        <div className="max-w-lg mx-auto mt-16 p-8 bg-white rounded-2xl border border-rose-200 shadow-floating text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">403 Forbidden: Access Restricted</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            According to the PeoplePay360 security policy, your assigned role (<b className="text-slate-800">{user.role}</b>) does not possess permission to access this module.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
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
