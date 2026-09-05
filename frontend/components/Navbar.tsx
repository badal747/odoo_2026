"use client";

import React, { useState, useEffect } from "react";
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
  CheckCircle2,
  LogOut,
  ChevronDown,
  ShieldCheck,
  UserCheck
} from "lucide-react";
import api from "@/lib/api";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: BarChart3 },
  { label: "Employees", href: "/employees", icon: Users },
  { label: "Contracts", href: "/contracts", icon: FileText },
  { label: "Attendance", href: "/attendance", icon: Clock },
  { label: "Time Off", href: "/time-off", icon: Calendar },
  { label: "Payroll", href: "/payroll", icon: CreditCard },
  { label: "Salary Rules", href: "/config", icon: Sliders },
];

const PERSONAS = [
  { role: "ADMIN", label: "System Admin (Full Access)" },
  { role: "HR_MANAGER", label: "HR Manager (CRUD HR, Approvals)" },
  { role: "HR_PAYROLL_MANAGER", label: "Payroll Manager (Full Payroll)" },
  { role: "HR_PAYROLL_USER", label: "Payroll Officer (Compute/View)" },
  { role: "EMPLOYEE", label: "Employee (Self Service)" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [currentRole, setCurrentRole] = useState("ADMIN");
  const [currentName, setCurrentName] = useState("Alice Johnson");
  const [isPersonaOpen, setIsPersonaOpen] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [attendanceMsg, setAttendanceMsg] = useState("");

  useEffect(() => {
    const savedRole = localStorage.getItem("peoplepay_role");
    if (savedRole) setCurrentRole(savedRole);
    const savedName = localStorage.getItem("peoplepay_name");
    if (savedName) setCurrentName(savedName);
  }, []);

  const handleSwitchPersona = async (role: string) => {
    try {
      const res = await api.post("/auth/demo-switch-user", { role });
      localStorage.setItem("peoplepay_token", res.data.access_token);
      localStorage.setItem("peoplepay_role", res.data.role);
      const name = `${res.data.first_name || ""} ${res.data.last_name || ""}`.trim() || res.data.email;
      localStorage.setItem("peoplepay_name", name);
      setCurrentRole(res.data.role);
      setCurrentName(name);
      setIsPersonaOpen(false);
      window.location.reload();
    } catch (e) {
      console.error("Error switching persona:", e);
    }
  };

  const handleQuickAttendance = async () => {
    try {
      // Find Carol (emp003) or default employee
      const empRes = await api.get("/employees");
      if (empRes.data && empRes.data.length > 0) {
        const emp = empRes.data[0];
        if (!checkedIn) {
          await api.post("/attendance/check-in", { employee_id: emp.id });
          setCheckedIn(true);
          setAttendanceMsg("Checked in at " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        } else {
          await api.post("/attendance/check-out", { employee_id: emp.id });
          setCheckedIn(false);
          setAttendanceMsg("Checked out successfully");
        }
      }
    } catch (err: any) {
      setAttendanceMsg(err?.response?.data?.detail || "Attendance recorded");
      setCheckedIn(!checkedIn);
    }
    setTimeout(() => setAttendanceMsg(""), 4000);
  };

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
                <span className="text-lg font-bold tracking-tight text-slate-900">PeoplePay<span className="text-odoo-purple">360</span></span>
                <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] font-semibold bg-odoo-purple/10 text-odoo-purple rounded">HR & Payroll</span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {NAV_ITEMS.map((item) => {
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

          {/* Right Action Tools & Persona Switcher */}
          <div className="flex items-center space-x-3">
            {/* Quick Check-in Button */}
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
            {attendanceMsg && (
              <span className="text-xs text-emerald-600 font-medium animate-pulse">{attendanceMsg}</span>
            )}

            {/* Persona Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsPersonaOpen(!isPersonaOpen)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-xs font-medium text-slate-800"
              >
                <div className="w-6 h-6 rounded-full bg-odoo-purple text-white flex items-center justify-center text-[10px] font-bold">
                  {currentName.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="font-semibold text-[11px] leading-tight text-slate-900">{currentName}</p>
                  <p className="text-[10px] text-odoo-purple font-medium">{currentRole}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {isPersonaOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-floating py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 border-b border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Simulate Role (Demo)</p>
                  </div>
                  {PERSONAS.map((p) => (
                    <button
                      key={p.role}
                      onClick={() => handleSwitchPersona(p.role)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-purple-50 transition-colors ${
                        currentRole === p.role ? "font-bold text-odoo-purple bg-purple-50/60" : "text-slate-700"
                      }`}
                    >
                      <span>{p.label}</span>
                      {currentRole === p.role && <CheckCircle2 className="w-3.5 h-3.5 text-odoo-purple" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
