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
  Layers,
  ChevronDown,
  Check,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import AuthHeroSlider from "@/components/AuthHeroSlider";

const DEMO_PERSONAS = [
  { role: "System Admin", email: "admin@peoplepay.com", pass: "password123" },
  { role: "HR Manager", email: "hrmanager@peoplepay.com", pass: "password123" },
  { role: "Payroll Manager", email: "payrollmgr@peoplepay.com", pass: "password123" },
  { role: "Payroll Officer", email: "payrolluser@peoplepay.com", pass: "password123" },
  { role: "Standard Employee", email: "employee@peoplepay.com", pass: "password123" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showDemoDropdown, setShowDemoDropdown] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.detail || "Invalid email or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg("");
    setShowDemoDropdown(false);
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white">
      {/* LEFT SIDE: Clean Minimalist Sign In Form */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-between p-6 sm:p-12 lg:p-16 xl:p-20">
        {/* Top bar (for subtle Demo Dropdown & Mobile Logo) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-sm shadow-sm">
              P
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900">
              PeoplePay<span className="text-odoo-purple">360</span>
            </span>
          </div>

          {/* Quick Demo Pre-fill Dropdown (Discreet & Non-Intrusive) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDemoDropdown(!showDemoDropdown)}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-all flex items-center space-x-1.5"
            >
              <span>Quick Demo Accounts</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showDemoDropdown && (
              <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl shadow-floating border border-slate-200 py-1.5 z-50 text-xs">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Select Persona to Fill
                </div>
                {DEMO_PERSONAS.map((p) => (
                  <button
                    key={p.email}
                    type="button"
                    onClick={() => handleSelectDemo(p.email, p.pass)}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-700 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-xs text-slate-900">{p.role}</div>
                      <div className="text-[10px] text-slate-400">{p.email}</div>
                    </div>
                    {email === p.email && <Check className="w-3.5 h-3.5 text-odoo-purple" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center Main Form */}
        <div className="my-auto max-w-sm w-full mx-auto py-8">
          {/* Form Icon Box */}
          <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-800 mb-6 shadow-subtle">
            <Layers className="w-5 h-5" />
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-1 mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Sign In to PeoplePay360
            </h1>
            <p className="text-xs text-slate-500 font-normal">
              Enter your email and password to access your account
            </p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 mb-5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-900 transition-all placeholder:text-slate-400 shadow-subtle"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-900 transition-all placeholder:text-slate-400 shadow-subtle font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50 mt-3"
            >
              <span>{loading ? "Signing in..." : "Sign In"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Switch to Register Link */}
            <div className="text-center pt-2">
              <p className="text-xs text-slate-500">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-slate-900 hover:underline"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* RIGHT SIDE: Auto-Rotating 5-Picture AI Hero Slider */}
      <AuthHeroSlider />
    </div>
  );
}
