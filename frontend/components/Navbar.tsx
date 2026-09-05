"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  FileText,
  Clock,
  Calendar,
  CreditCard,
  Sliders,
  BarChart3,
  LogOut,
  Compass,
} from "lucide-react";
import { useAuth, UserRole } from "@/lib/auth-context";
import api from "@/lib/api";
import DemoTourModal from "@/components/DemoTourModal";

interface NavItem {
  label: string;
  href: string;
  icon: any;
  allowedRoles: UserRole[];
}

const ALL_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: BarChart3, allowedRoles: ["ADMIN", "HR_MANAGER", "HR_PAYROLL_MANAGER", "HR_PAYROLL_USER", "EMPLOYEE"] },
  { label: "Employees", href: "/employees", icon: Users, allowedRoles: ["ADMIN", "HR_MANAGER", "HR_PAYROLL_MANAGER", "HR_PAYROLL_USER"] },
  { label: "Contracts", href: "/contracts", icon: FileText, allowedRoles: ["ADMIN", "HR_MANAGER", "HR_PAYROLL_MANAGER", "HR_PAYROLL_USER"] },
  { label: "Attendance", href: "/attendance", icon: Clock, allowedRoles: ["ADMIN", "HR_MANAGER", "HR_PAYROLL_MANAGER", "HR_PAYROLL_USER", "EMPLOYEE"] },
  { label: "Time Off", href: "/time-off", icon: Calendar, allowedRoles: ["ADMIN", "HR_MANAGER", "HR_PAYROLL_MANAGER", "HR_PAYROLL_USER", "EMPLOYEE"] },
  { label: "Payroll", href: "/payroll", icon: CreditCard, allowedRoles: ["ADMIN", "HR_PAYROLL_MANAGER", "HR_PAYROLL_USER"] },
  { label: "Salary Rules", href: "/config", icon: Sliders, allowedRoles: ["ADMIN", "HR_PAYROLL_MANAGER", "HR_PAYROLL_USER"] },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [checkedIn, setCheckedIn] = useState(false);
  const [attendanceMsg, setAttendanceMsg] = useState("");
  const [isDemoTourOpen, setIsDemoTourOpen] = useState(false);

  // Don't render navigation menus on the login and register screens
  if (pathname === "/login" || pathname === "/register") {
    return (
      <header className="bg-white border-b border-odoo-border shadow-subtle py-3 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-odoo-purpleDark via-odoo-purple to-odoo-teal flex items-center justify-center text-white font-black text-base shadow-sm">
              P
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900">
              PeoplePay<span className="text-odoo-purple">360</span>
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium">Enterprise HR & Payroll Portal</span>
        </div>
      </header>
    );
  }

  // Filter navigation items strictly by active user's role
  const visibleNavItems = ALL_NAV_ITEMS.filter((item) => {
    if (!user) return false;
    if (user.role === "ADMIN") return true;
    return item.allowedRoles.includes(user.role);
  });

  const handleQuickAttendance = async () => {
    if (!user) return;
    try {
      const empId = user.employee_id;
      if (!empId) {
        setAttendanceMsg("No linked employee profile");
        return;
      }
      if (!checkedIn) {
        await api.post("/attendance/check-in", { employee_id: empId });
        setCheckedIn(true);
        setAttendanceMsg("Checked in at " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } else {
        await api.post("/attendance/check-out", { employee_id: empId });
        setCheckedIn(false);
        setAttendanceMsg("Checked out successfully");
      }
    } catch (err: any) {
      setAttendanceMsg(err?.response?.data?.detail || "Attendance recorded");
      setCheckedIn(!checkedIn);
    }
    setTimeout(() => setAttendanceMsg(""), 4000);
  };

  const displayName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.email || "User";

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-odoo-border shadow-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-odoo-purpleDark via-odoo-purple to-odoo-teal flex items-center justify-center text-white font-black text-lg shadow-sm">
                P
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-900">
                  PeoplePay<span className="text-odoo-purple">360</span>
                </span>
                <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] font-semibold bg-odoo-purple/10 text-odoo-purple rounded">
                  HR & Payroll
                </span>
              </div>
            </Link>
          </div>

          {/* Role-Filtered Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-odoo-purple text-white shadow-sm"
                      : "text-slate-600 hover:text-odoo-purple hover:bg-slate-50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Tools & User Profile */}
          <div className="flex items-center space-x-3">
            {/* Hackathon Demo Tour Guide Button */}
            <button
              onClick={() => setIsDemoTourOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100/80 text-amber-900 hover:bg-amber-200/80 border border-amber-300 shadow-sm transition-all animate-pulse hover:animate-none"
              title="Hackathon Demo & Scenario Guide"
            >
              <Compass className="w-3.5 h-3.5 text-amber-700" />
              <span>Demo Guide</span>
            </button>

            {/* Quick Attendance Check-in Button */}
            {user?.employee_id && (
              <button
                onClick={handleQuickAttendance}
                title="Quick Check-In / Check-Out"
                className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  checkedIn
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>{checkedIn ? "Check Out" : "Check In"}</span>
              </button>
            )}
            {attendanceMsg && (
              <span className="text-xs text-emerald-600 font-medium animate-pulse">{attendanceMsg}</span>
            )}

            {/* Authenticated User Badge & Logout */}
            {user && (
              <div className="flex items-center space-x-3 pl-2 border-l border-slate-200">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-full bg-odoo-purple text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="font-semibold text-xs leading-tight text-slate-900">{displayName}</p>
                    <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-purple-50 text-odoo-purple border border-purple-100">
                      {user.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <DemoTourModal isOpen={isDemoTourOpen} onClose={() => setIsDemoTourOpen(false)} />
    </header>
  );
}
