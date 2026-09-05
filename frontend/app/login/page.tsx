"use client";

import React, { useState } from "react";
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const QUICK_ACCOUNTS = [
  { role: "Admin", email: "admin@peoplepay.com", desc: "Full System Administration" },
  { role: "HR Manager", email: "hrmanager@peoplepay.com", desc: "HR Master Data & Time Off Approvals" },
  { role: "Payroll Manager", email: "payrollmgr@peoplepay.com", desc: "Payruns, Payslips & Salary Rules" },
  { role: "Payroll Officer", email: "payrolluser@peoplepay.com", desc: "Compute Payruns (Read-only Rules)" },
  { role: "Employee", email: "employee@peoplepay.com", desc: "Personal Profile & Attendance" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@peoplepay.com");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.detail || "Invalid email or password. Please verify credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (accEmail: string) => {
    setEmail(accEmail);
    setPassword("password123");
    setErrorMsg("");
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-floating p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-xl bg-gradient-to-tr from-odoo-purpleDark via-odoo-purple to-odoo-teal items-center justify-center text-white font-black text-2xl shadow-sm mb-1">
            P
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            PeoplePay<span className="text-odoo-purple">360</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Sign in to your HR & Payroll Operations Account
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="you@peoplepay.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-odoo-purple hover:bg-odoo-purpleHover text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2 mt-2"
          >
            <span>{loading ? "Authenticating..." : "Sign In to Workspace"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Credentials Pre-fill Box for Demonstrations */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center space-x-1 mb-2.5 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Quick Fill Demo Personas</span>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {QUICK_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleQuickFill(acc.email)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg border text-[11px] transition-colors flex items-center justify-between ${
                  email === acc.email
                    ? "bg-purple-50/70 border-odoo-purple/40 text-odoo-purple font-semibold"
                    : "bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span>{acc.role} ({acc.email})</span>
                <span className="text-[10px] text-slate-400">{acc.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
