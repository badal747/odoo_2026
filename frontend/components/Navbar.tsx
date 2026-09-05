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
  Menu,
  X,
} from "lucide-react";
import { useAuth, UserRole } from "@/lib/auth-context";
import api from "@/lib/api";

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
  const [attendanceState, setAttendanceState] = useState<{
    checkedIn: boolean;
    checkedOut: boolean;
    checkInTime?: string;
    checkOutTime?: string;
    workedHours?: number;
  }>({
    checkedIn: false,
    checkedOut: false,
  });
  const [attendanceMsg, setAttendanceMsg] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Synchronize real-time today attendance status
  const syncAttendanceStatus = async () => {
    if (!user?.employee_id) return;
    try {
      const today = new Date().toLocaleDateString("en-CA");
      const res = await api.get("/attendance/status", { params: { date: today } });
      if (res.data && res.data.has_record) {
        setAttendanceState({
          checkedIn: res.data.checked_in,
          checkedOut: res.data.checked_out,
          checkInTime: res.data.check_in ? new Date(res.data.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
          checkOutTime: res.data.check_out ? new Date(res.data.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
          workedHours: res.data.worked_hours,
        });
      } else {
        setAttendanceState({ checkedIn: false, checkedOut: false });
      }
    } catch {
      // Ignore if status endpoint unreachable
    }
  };

  React.useEffect(() => {
    syncAttendanceStatus();
    const handleAttendanceUpdate = () => syncAttendanceStatus();
    window.addEventListener("attendance-updated", handleAttendanceUpdate);
    return () => window.removeEventListener("attendance-updated", handleAttendanceUpdate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.employee_id]);

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
    const empId = user.employee_id;
    if (!empId) {
      setAttendanceMsg("No linked employee profile");
      setTimeout(() => setAttendanceMsg(""), 3000);
      return;
    }
    const todayStr = new Date().toLocaleDateString("en-CA");

    try {
      if (!attendanceState.checkedIn) {
        setAttendanceMsg("Checking in...");
        await api.post("/attendance/check-in", { employee_id: empId, date: todayStr });
        setAttendanceState((prev) => ({
          ...prev,
          checkedIn: true,
          checkedOut: false,
          checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));
        setAttendanceMsg("Checked in at " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        window.dispatchEvent(new Event("attendance-updated"));
      } else if (!attendanceState.checkedOut) {
        setAttendanceMsg("Checking out...");
        const res = await api.post("/attendance/check-out", { employee_id: empId, date: todayStr });
        const hours = res.data?.worked_hours || 0;
        setAttendanceState((prev) => ({
          ...prev,
          checkedOut: true,
          workedHours: hours,
        }));
        setAttendanceMsg(`Checked out (${hours} hrs)`);
        window.dispatchEvent(new Event("attendance-updated"));
      } else {
        setAttendanceMsg("Shift completed for today");
      }
    } catch (err: any) {
      setAttendanceMsg(err?.response?.data?.detail || "Attendance action failed");
      syncAttendanceStatus();
    }
    setTimeout(() => setAttendanceMsg(""), 4000);
  };

  const displayName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.email || "User";

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-black text-base shadow-sm">
                P
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-slate-900">
                  PeoplePay<span className="text-slate-900">360</span>
                </span>
                <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded border border-slate-200">
                  HR &amp; Payroll
                </span>
              </div>
            </Link>
          </div>

          {/* Role-Filtered Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold active:scale-95 transition-all duration-75 ${
                    isActive
                      ? "bg-black text-white shadow-sm"
                      : "text-slate-600 hover:text-black hover:bg-slate-100/80 font-medium"
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
            {/* Quick Attendance Check-in / Check-out Button */}
            {user?.employee_id && (
              <button
                onClick={handleQuickAttendance}
                title={
                  attendanceState.checkedOut
                    ? `Shift completed for today (${attendanceState.workedHours || 0} hrs)`
                    : attendanceState.checkedIn
                    ? `Checked in at ${attendanceState.checkInTime || ""}. Click to Check Out.`
                    : "Click to Check In for today"
                }
                className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                  attendanceState.checkedOut
                    ? "bg-purple-50 text-purple-700 border border-purple-200 cursor-default"
                    : attendanceState.checkedIn
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 shadow-sm"
                    : "bg-black hover:bg-slate-800 text-white shadow-sm"
                }`}
              >
                <Clock className={`w-3.5 h-3.5 ${
                  attendanceState.checkedOut
                    ? "text-purple-600"
                    : attendanceState.checkedIn
                    ? "text-emerald-600"
                    : "text-white"
                }`} />
                <span>
                  {attendanceState.checkedOut
                    ? `Checked Out (${attendanceState.workedHours || 0}h)`
                    : attendanceState.checkedIn
                    ? `Check Out (${attendanceState.checkInTime || ""})`
                    : "Check In"}
                </span>
              </button>
            )}
            {attendanceMsg && (
              <span className="text-xs text-emerald-600 font-medium animate-pulse">{attendanceMsg}</span>
            )}

            {/* Authenticated User Badge & Logout */}
            {user && (
              <div className="flex items-center space-x-3 pl-2 border-l border-slate-200">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="font-semibold text-xs leading-tight text-slate-900">{displayName}</p>
                    <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      {user.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={logout}
                  title="Sign Out"
                  className="hidden sm:flex p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-black hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 py-3 px-2 space-y-1 bg-white animate-in slide-in-from-top-2 duration-150">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-black text-white shadow-sm"
                      : "text-slate-700 hover:text-black hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Mobile Quick Attendance & Sign Out */}
            <div className="pt-2 mt-2 border-t border-slate-100 space-y-2">
              {user?.employee_id && (
                <button
                  onClick={() => {
                    handleQuickAttendance();
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    attendanceState.checkedOut
                      ? "bg-purple-50 text-purple-700 border border-purple-200"
                      : attendanceState.checkedIn
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                      : "bg-black text-white"
                  }`}
                >
                  <Clock className={`w-3.5 h-3.5 ${
                    attendanceState.checkedOut
                      ? "text-purple-600"
                      : attendanceState.checkedIn
                      ? "text-emerald-600"
                      : "text-white"
                  }`} />
                  <span>
                    {attendanceState.checkedOut
                      ? `Shift Completed (${attendanceState.workedHours || 0} hrs)`
                      : attendanceState.checkedIn
                      ? `Check Out Now (${attendanceState.checkInTime || ""})`
                      : "Check In Now"}
                  </span>
                </button>
              )}

              <button
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out ({displayName})</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
