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
  ShieldCheck,
  CheckCircle2,
  Shield,
  Briefcase,
  Users,
  CreditCard,
  UserCheck,
} from "lucide-react";
import { useAuth, UserRole } from "@/lib/auth-context";

interface RoleChip {
  role: UserRole;
  label: string;
  badge: string;
  icon: any;
  summary: string;
}

const ROLE_OPTIONS: RoleChip[] = [
  {
    role: "EMPLOYEE",
    label: "Employee",
    badge: "Staff Self-Service",
    icon: User,
    summary: "Personal attendance clock-in/out, monthly payslips, and leave requests",
  },
  {
    role: "HR_MANAGER",
    label: "HR Manager",
    badge: "People Operations",
    icon: Users,
    summary: "Employee directory, department management, and time-off approvals",
  },
  {
    role: "HR_PAYROLL_MANAGER",
    label: "Payroll Manager",
    badge: "Finance & Payroll",
    icon: CreditCard,
    summary: "Monthly payruns, salary rule formulas, validation and bank CSV export",
  },
  {
    role: "HR_PAYROLL_USER",
    label: "Payroll Officer",
    badge: "Payroll Operations",
    icon: Briefcase,
    summary: "Batch compute payruns and payslip inspection (read-only rules)",
  },
  {
    role: "ADMIN",
    label: "Admin",
    badge: "Super Admin",
    icon: Shield,
    summary: "Unrestricted operational authority across all modules and audit controls",
  },
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

  const selectedRoleDetails = ROLE_OPTIONS.find((r) => r.role === selectedRole);

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
        err?.response?.data?.detail || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white">
      {/* LEFT SIDE: Brand Showcase & Hero Imagery */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-7/12 flex-col justify-between p-12 xl:p-16 overflow-hidden bg-slate-900 text-white">
        {/* Background Corporate Architecture Image */}
        <div
          className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-35 scale-105 transition-transform duration-1000 ease-out"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#482D41]/95 via-[#714B67]/90 to-[#017E84]/85" />

        {/* Ambient Glows */}
        <div className="absolute top-1/3 -left-20 w-96 h-96 bg-odoo-purple/40 rounded-full blur-3xl pointer-events-none" />
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
              Zero-Conflict Workforce Governance
            </span>
          </div>
        </div>

        {/* Middle Hero Statement */}
        <div className="relative z-10 my-auto py-10 space-y-6 max-w-xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-purple-100 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
            <span>Instant Role Provisioning Engine</span>
          </div>

          <h1 className="text-3xl xl:text-4xl 2xl:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Start managing your team <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-200 via-white to-purple-200">
              with zero friction.
            </span>
          </h1>

          <p className="text-sm xl:text-base text-purple-100/90 leading-relaxed">
            Create your account in seconds. Our system automatically provisions an isolated employee record, running employment contract, and leave balance in MongoDB Atlas.
          </p>

          {/* Three Key Architectural Guarantees */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start space-x-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
              <ShieldCheck className="w-5 h-5 text-teal-300 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Zero-Conflict Data Isolation</h4>
                <p className="text-[11px] text-purple-200/80">Every user account receives its own dedicated employee ID, contracts, and salary records.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
              <CheckCircle2 className="w-5 h-5 text-teal-300 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Automated Contract Provisioning</h4>
                <p className="text-[11px] text-purple-200/80">Pre-configured with standard Indian statutory salary structure and active running status.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
              <UserCheck className="w-5 h-5 text-teal-300 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Pre-Allocated Annual Leaves</h4>
                <p className="text-[11px] text-purple-200/80">20 Paid Time Off days and 10 Sick Leave days ready for attendance tracking.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Trust Card */}
        <div className="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between text-xs text-purple-200">
          <span className="font-semibold text-white text-xs">Enterprise Ready Platform</span>
          <div className="flex items-center space-x-1 text-teal-300">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-semibold text-xs">FastAPI & MongoDB Atlas Live</span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Clean Modern Register Form */}
      <div className="w-full lg:w-1/2 xl:w-5/12 flex flex-col justify-center px-6 sm:px-12 xl:px-16 py-10 min-h-screen bg-slate-50/40">
        <div className="max-w-md w-full mx-auto space-y-6">
          {/* Mobile Logo Header */}
          <div className="lg:hidden flex items-center space-x-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-odoo-purple flex items-center justify-center text-white font-black text-lg shadow-sm">
              P
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              PeoplePay<span className="text-odoo-purple">360</span>
            </span>
          </div>

          {/* Form Header */}
          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Create an account
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Select your role and enter your details to launch your workspace.
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. ROLE SELECTOR CHIPS */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Select Your Role
              </label>
              <div className="grid grid-cols-5 gap-1">
                {ROLE_OPTIONS.map((item) => {
                  const isSelected = selectedRole === item.role;
                  return (
                    <button
                      key={item.role}
                      type="button"
                      onClick={() => setSelectedRole(item.role)}
                      className={`py-2 px-1 rounded-xl border text-center transition-all flex flex-col items-center justify-center space-y-1 ${
                        isSelected
                          ? "bg-purple-100 border-odoo-purple text-odoo-purple font-bold shadow-xs ring-1 ring-odoo-purple/30"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300"
                      }`}
                    >
                      <item.icon className="w-3.5 h-3.5" />
                      <span className="text-[10px] truncate max-w-full">{item.label}</span>
                    </button>
                  );
                })}
              </div>
              {/* Selected Role Summary Pill */}
              {selectedRoleDetails && (
                <div className="px-3 py-1.5 rounded-lg bg-purple-50/60 border border-purple-100 text-[11px] text-odoo-purple flex items-center justify-between">
                  <span className="font-semibold">{selectedRoleDetails.badge}</span>
                  <span className="text-slate-500 text-[10px]">{selectedRoleDetails.summary}</span>
                </div>
              )}
            </div>

            {/* 2. NAME FIELDS (2 COLUMNS) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Rachel"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple transition-all shadow-subtle"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Last Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Green"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple transition-all shadow-subtle"
                  />
                </div>
              </div>
            </div>

            {/* 3. EMAIL FIELD */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple transition-all shadow-subtle placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* 4. PASSWORD FIELDS (2 COLUMNS) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple transition-all shadow-subtle font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple transition-all shadow-subtle font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-odoo-purple hover:bg-odoo-purpleHover text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 text-xs disabled:opacity-50 mt-3"
            >
              <span>{loading ? "Provisioning Your Account..." : "Create Account & Launch Workspace"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Footer Link to Login */}
          <div className="text-center pt-2">
            <p className="text-xs text-slate-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-bold text-odoo-purple hover:underline inline-flex items-center space-x-0.5"
              >
                <span>Sign in to workspace</span>
                <ArrowRight className="w-3 h-3 inline" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
