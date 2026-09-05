"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Users,
  CreditCard,
  Star,
} from "lucide-react";
import { useAuth, UserRole } from "@/lib/auth-context";

const DEMO_PERSONAS: { roleName: string; email: string; roleBadge: string }[] = [
  { roleName: "Admin", email: "admin@peoplepay.com", roleBadge: "Super Admin" },
  { roleName: "HR Manager", email: "hrmanager@peoplepay.com", roleBadge: "People Ops" },
  { roleName: "Payroll Mgr", email: "payrollmgr@peoplepay.com", roleBadge: "Finance" },
  { roleName: "Payroll User", email: "payrolluser@peoplepay.com", roleBadge: "Payroll" },
  { roleName: "Employee", email: "employee@peoplepay.com", roleBadge: "Staff" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@peoplepay.com");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
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
        err?.response?.data?.detail || "Invalid email or password. Please check your credentials."
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
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white">
      {/* LEFT SIDE: Brand Showcase & Hero Imagery */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-7/12 flex-col justify-between p-12 xl:p-16 overflow-hidden bg-slate-900 text-white">
        {/* Background Image with Depth Gradient Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-35 scale-105 transition-transform duration-1000 ease-out"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#482D41]/95 via-[#714B67]/90 to-[#017E84]/85" />

        {/* Subtle Decorative Ambient Glow */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-odoo-purple/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-odoo-teal/30 rounded-full blur-3xl pointer-events-none" />

        {/* Top Brand Header */}
        <div className="relative z-10 flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-black text-xl shadow-lg">
            P
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white">
              PeoplePay<span className="text-teal-300">360</span>
            </span>
            <span className="block text-[11px] text-purple-200/80 font-medium tracking-wide">
              Enterprise HR & Payroll Platform
            </span>
          </div>
        </div>

        {/* Middle Hero Statement */}
        <div className="relative z-10 my-auto py-12 space-y-6 max-w-xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-purple-100 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
            <span>Next-Gen Enterprise Workforce Operations</span>
          </div>

          <h1 className="text-3xl xl:text-4xl 2xl:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Automate your payroll, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-200 via-white to-purple-200">
              empower your people.
            </span>
          </h1>

          <p className="text-sm xl:text-base text-purple-100/90 leading-relaxed">
            The all-in-one platform unifying staff directory, attendance clocking, leave management, and automated statutory payroll computation.
          </p>

          {/* Value Props */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
              <CreditCard className="w-5 h-5 text-teal-300 shrink-0" />
              <span className="text-xs font-semibold text-white">1-Click Payrun Engine</span>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
              <ShieldCheck className="w-5 h-5 text-teal-300 shrink-0" />
              <span className="text-xs font-semibold text-white">Strict Multi-Tier RBAC</span>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
              <Building2 className="w-5 h-5 text-teal-300 shrink-0" />
              <span className="text-xs font-semibold text-white">Bank CSV Register Export</span>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
              <Users className="w-5 h-5 text-teal-300 shrink-0" />
              <span className="text-xs font-semibold text-white">Zero Conflict Isolation</span>
            </div>
          </div>
        </div>

        {/* Bottom Metric / Trust Card */}
        <div className="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between text-xs text-purple-200">
          <div className="flex items-center space-x-2">
            <div className="flex -space-x-2">
              <img
                className="w-7 h-7 rounded-full border-2 border-[#482D41]"
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100"
                alt="Alice"
              />
              <img
                className="w-7 h-7 rounded-full border-2 border-[#482D41]"
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"
                alt="Bob"
              />
              <img
                className="w-7 h-7 rounded-full border-2 border-[#482D41]"
                src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100"
                alt="Carol"
              />
            </div>
            <span className="font-semibold text-white text-xs">15+ Active Organization Staff</span>
          </div>
          <div className="flex items-center space-x-1 text-teal-300">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-semibold text-xs">MongoDB Atlas Sync</span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Clean Modern Login Form */}
      <div className="w-full lg:w-1/2 xl:w-5/12 flex flex-col justify-center px-6 sm:px-12 xl:px-16 py-12 min-h-screen bg-slate-50/40">
        <div className="max-w-md w-full mx-auto space-y-8">
          {/* Mobile Logo Brand Header (Shown on small screens) */}
          <div className="lg:hidden flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-odoo-purple flex items-center justify-center text-white font-black text-lg shadow-sm">
              P
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              PeoplePay<span className="text-odoo-purple">360</span>
            </span>
          </div>

          {/* Form Header */}
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Welcome back
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Please enter your credentials to access your workspace.
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form Inputs */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple transition-all shadow-subtle placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <span className="text-[11px] text-odoo-purple hover:underline cursor-pointer font-medium">
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple transition-all shadow-subtle font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-odoo-purple hover:bg-odoo-purpleHover text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 text-xs disabled:opacity-50 mt-2"
            >
              <span>{loading ? "Authenticating..." : "Sign In to Workspace"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Personas - Elegant Discrete Bar */}
          <div className="pt-5 border-t border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Demo 1-Click Fast Fill</span>
              </span>
              <span className="text-[10px] text-slate-400">Default: password123</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {DEMO_PERSONAS.map((p) => (
                <button
                  key={p.email}
                  type="button"
                  onClick={() => handleQuickFill(p.email)}
                  className={`py-1.5 px-1 text-center rounded-lg border text-[10px] transition-all truncate font-medium ${
                    email === p.email
                      ? "bg-purple-100 border-odoo-purple text-odoo-purple font-bold shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300"
                  }`}
                  title={`${p.roleName} (${p.email})`}
                >
                  {p.roleName}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Link to Register */}
          <div className="text-center pt-2">
            <p className="text-xs text-slate-500">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-bold text-odoo-purple hover:underline inline-flex items-center space-x-0.5"
              >
                <span>Create an account</span>
                <ArrowRight className="w-3 h-3 inline" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
