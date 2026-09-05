"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
  Layers,
  Info,
  BookOpen,
  CreditCard,
  Shield,
  Briefcase,
  Users,
} from "lucide-react";
import { useAuth, UserRole } from "@/lib/auth-context";
import AuthHeroSlider from "@/components/AuthHeroSlider";
import { AboutModal, DocumentationModal } from "@/components/AuthModals";

interface RoleOption {
  role: UserRole;
  label: string;
  icon: any;
}

const ROLES: RoleOption[] = [
  { role: "EMPLOYEE", label: "Employee", icon: User },
  { role: "HR_MANAGER", label: "HR Manager", icon: Users },
  { role: "HR_PAYROLL_MANAGER", label: "Payroll Mgr", icon: CreditCard },
  { role: "HR_PAYROLL_USER", label: "Payroll Officer", icon: Briefcase },
  { role: "ADMIN", label: "Admin", icon: Shield },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>("EMPLOYEE");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg("Please enter both first and last name.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please verify.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      await register({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        password,
        role: selectedRole,
      });
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.detail || "Registration failed. Please review your details."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white">
      {/* LEFT SIDE: Clean Minimalist Register Form */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-between p-6 sm:p-12 lg:p-16 xl:p-20">
        {/* Top Brand Mark */}
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-sm shadow-sm">
            P
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900">
            PeoplePay<span className="text-odoo-purple">360</span>
          </span>
        </div>

        {/* Center Main Form */}
        <div className="my-auto max-w-sm w-full mx-auto py-6">
          {/* Form Icon Box */}
          <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-800 mb-5 shadow-subtle">
            <Layers className="w-5 h-5" />
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-1 mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Create an account
            </h1>
            <p className="text-xs text-slate-500 font-normal">
              Select your role and enter your details to launch your workspace
            </p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 mb-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* 1. ROLE SELECTION ROW */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Select Your Role
              </label>
              <div className="grid grid-cols-5 gap-1">
                {ROLES.map((r) => {
                  const isSelected = selectedRole === r.role;
                  return (
                    <button
                      key={r.role}
                      type="button"
                      onClick={() => setSelectedRole(r.role)}
                      className={`py-2 px-1 rounded-xl border text-center transition-all flex flex-col items-center justify-center space-y-1 ${
                        isSelected
                          ? "bg-slate-900 border-slate-900 text-white font-bold shadow-sm"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <r.icon className="w-3.5 h-3.5" />
                      <span className="text-[10px] truncate max-w-full">{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. FIRST & LAST NAME (2 COLUMNS) */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Rachel"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-900 transition-all placeholder:text-slate-400 shadow-subtle"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Last Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Green"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-900 transition-all placeholder:text-slate-400 shadow-subtle"
                  />
                </div>
              </div>
            </div>

            {/* 3. EMAIL ADDRESS */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-900 transition-all placeholder:text-slate-400 shadow-subtle"
                />
              </div>
            </div>

            {/* 4. PASSWORD & CONFIRM PASSWORD (2 COLUMNS) */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-7 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-900 transition-all shadow-subtle font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-7 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-900 transition-all shadow-subtle font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50 mt-2"
            >
              <span>{loading ? "Creating Account..." : "Create Account"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Switch to Login */}
            <div className="text-center pt-1.5">
              <p className="text-xs text-slate-500">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-slate-900 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Bottom Footer Links */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => setIsAboutOpen(true)}
            className="flex items-center space-x-1 hover:text-slate-900 transition-colors focus:outline-none"
          >
            <Info className="w-3.5 h-3.5 text-odoo-purple" />
            <span className="font-medium">About PeoplePay360</span>
          </button>
          <button
            type="button"
            onClick={() => setIsDocsOpen(true)}
            className="flex items-center space-x-1 hover:text-slate-900 transition-colors focus:outline-none"
          >
            <BookOpen className="w-3.5 h-3.5 text-odoo-teal" />
            <span className="font-medium">Payroll Documentation</span>
          </button>
        </div>
      </div>

      {/* RIGHT SIDE: Auto-Rotating 5-Picture AI Hero Slider */}
      <AuthHeroSlider />

      {/* Interactive Information & Documentation Modals */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      <DocumentationModal isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
    </div>
  );
}
