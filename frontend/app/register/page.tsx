"use client";
/* eslint-disable @next/next/no-img-element */

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
  Layers,
  CreditCard,
  Shield,
  Briefcase,
  Users,
  Award,
  Zap,
  Clock,
  ShieldCheck,
  FileSpreadsheet,
  CheckCircle2,
  BookOpen,
  ArrowUpRight,
  X,
} from "lucide-react";
import { useAuth, UserRole } from "@/lib/auth-context";
import AuthHeroSlider from "@/components/AuthHeroSlider";

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

interface BlogPost {
  id: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  author: string;
  authorRole: string;
  image: string;
  excerpt: string;
  content: string[];
  takeaways: string[];
}

const BLOG_POSTS: BlogPost[] = [
  {
    id: "ast-payroll",
    title: "The Algorithmic Payroll Revolution: Why Python AST Formula Engines Beat Spreadsheets",
    category: "Payroll Innovation",
    date: "March 4, 2026",
    readTime: "5 min read",
    author: "Aarav Mehta",
    authorRole: "Principal Systems Architect",
    image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80",
    excerpt: "How Abstract Syntax Tree (AST) evaluation eliminates calculation drift, mid-month proration disputes, and formulas hidden inside legacy spreadsheets.",
    content: [
      "Traditional HR teams spend an average of 4-7 business days every month reconciling Excel spreadsheets. Even minor copy-paste errors in nested IF statements can miscalculate tax deductions or propagate incorrect gross wages.",
      "At PeoplePay360, we replaced brittle cell formulas with safe Python AST (Abstract Syntax Tree) mathematical evaluators. Instead of hardcoding values, each salary rule operates as an independent node in an execution sequence—computing Basic, HRA, Conveyance, PF (12%), and progressive TDS in milliseconds.",
      "Furthermore, AST evaluation prevents malicious code injection while empowering HR payroll administrators to write dynamic formulas like `(GROSS > 50000) * ((GROSS - 50000) * 0.10)` directly from the browser without needing developer intervention.",
    ],
    takeaways: [
      "Zero formula drift across 1,000+ monthly payslips",
      "Automatic mid-month prorations based on verified attendance punches",
      "Safe AST parsing ensures mathematical security without raw eval() risks",
    ],
  },
  {
    id: "statutory-compliance",
    title: "Mastering Indian Statutory Compliance: EPF, ESI, Professional Tax & TDS Demystified",
    category: "Tax & Compliance",
    date: "March 2, 2026",
    readTime: "7 min read",
    author: "Pooja Sharma",
    authorRole: "Head of People Operations",
    image: "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80",
    excerpt: "A practical guide for corporate leaders to automate monthly tax deduction schedules and generate bank-ready disbursement registers with zero penalties.",
    content: [
      "Statutory compliance in India requires meticulous synchronization between attendance data and payroll withholdings. Employee Provident Fund (EPF), Professional Tax (PT), and Tax Deducted at Source (TDS) are subject to stringent government deadlines.",
      "Our automated statutory engine pre-validates all mandatory bank and PAN identification numbers prior to batch disbursement. If an employee is missing their IFSC code or tax identifier, the system flags a pre-validation warning immediately.",
      "Once resolved, the 1-click bank transfer register compiles employee codes, account numbers, and net disbursements into an audited CSV format ready for direct upload to corporate net banking portals.",
    ],
    takeaways: [
      "Guaranteed zero penalties with automated statutory schedule rules",
      "Integrated bank details pre-validation before marking payruns as paid",
      "1-click export of bank-ready bulk transfer schedules (CSV format)",
    ],
  },
  {
    id: "transparent-attendance",
    title: "From Clock-In to Compensation: How Transparent Attendance Drives Workplace Trust",
    category: "Workforce Strategy",
    date: "February 28, 2026",
    readTime: "4 min read",
    author: "Devang Trivedi",
    authorRole: "Workforce Analytics Lead",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80",
    excerpt: "Why self-service attendance clocking with transparent supervisor audit notes builds lasting organizational trust and eliminates payroll day surprises.",
    content: [
      "Attendance friction is one of the top reasons for employee dissatisfaction during payroll week. When employees are unsure whether a late arrival was docked or if overtime hours were recorded, disputes inevitably arise.",
      "PeoplePay360 introduces a transparent, self-service attendance model. Employees can check in directly from their portal with instantaneous 0ms visual feedback. The system automatically tags shifts as Present, Late (grace period past 09:15), Half-day (< 4 hours), or Overtime (>= 9 hours).",
      "Whenever a supervisor makes a manual adjustment, our platform enforces a mandatory audit note explaining the correction and records the supervisor's user ID. This immutable log ensures complete accountability across the organization.",
    ],
    takeaways: [
      "Real-time check-in and check-out with automatic worked-hour calculation",
      "Mandatory supervisor audit trails for any manual time corrections",
      "Direct propagation into payroll engine for seamless unpaid leave deductions",
    ],
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

  // Modal States
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isBlogOpen, setIsBlogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

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
    <div className="h-screen w-full bg-white flex flex-col lg:flex-row overflow-hidden selection:bg-slate-900 selection:text-white">
      {/* LEFT SIDE: Clean Minimalist Register Form */}
      <div className="w-full lg:w-1/2 h-full flex flex-col justify-between p-5 sm:p-8 lg:p-10 xl:p-12 overflow-y-auto lg:overflow-hidden">
        {/* Top Bar with Brand & Navigation Links */}
        <div className="flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-sm shadow-sm">
              P
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900">
              PeoplePay<span className="text-slate-900">360</span>
            </span>
          </div>

          <nav className="hidden sm:flex items-center space-x-3 text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setIsAboutOpen(true)}
              className="hover:text-black transition-colors"
            >
              About Us
            </button>
            <button
              type="button"
              onClick={() => setIsBlogOpen(true)}
              className="hover:text-black transition-colors"
            >
              Blog
            </button>
          </nav>
        </div>

        {/* Center Main Form */}
        <div className="max-w-sm w-full mx-auto flex-1 flex flex-col justify-center py-4">
          {/* Form Icon Box */}
          <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-800 mb-5 shadow-subtle">
            <Layers className="w-5 h-5" />
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-1 mb-5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Create an account
            </h1>
            <p className="text-xs text-slate-500 font-normal">
              Select your role and enter your details to launch your workspace
            </p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 mb-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center space-x-2 animate-in fade-in duration-150">
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
              className="w-full py-3 bg-black hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50 mt-2 active:scale-95"
            >
              <span>{loading ? "Creating Account..." : "Create Account"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Switch to Login */}
            <div className="text-center pt-1">
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

        {/* Bottom Copyright */}
        <div className="pt-3 border-t border-slate-100 shrink-0">
          <span className="text-xs text-slate-400">© 2026 PeoplePay360 Inc.</span>
        </div>
      </div>

      {/* RIGHT SIDE: Auto-Rotating 5-Picture AI Hero Slider */}
      <AuthHeroSlider />

      {/* ─── ABOUT US MODAL ─── */}
      {isAboutOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150"
          onClick={() => setIsAboutOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 relative space-y-8 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsAboutOpen(false)}
              className="absolute right-5 top-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors z-10"
              aria-label="Close about modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center space-y-3 max-w-3xl mx-auto">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                <Award className="w-3.5 h-3.5 text-black" />
                <span>About PeoplePay360</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Pioneering Intelligent Human Capital &amp; Algorithmic Payroll
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                We built PeoplePay360 to eliminate administrative chaos from workplace management. By unifying real-time attendance punching, atomic leave balance accounting, and Python AST mathematical salary calculations into one frictionless ecosystem, companies can disburse compliant payroll in seconds.
              </p>
            </div>

            {/* 4 Pillars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shadow-sm">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Python AST Payroll Engine</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Dynamic rules for Basic, HRA, Conveyance, EPF 12%, Professional Tax, and progressive TDS evaluated via clean mathematical abstract syntax trees.
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-slate-200 text-[11px] font-semibold text-slate-700 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Zero Formula Errors</span>
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shadow-sm">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Real-Time Attendance</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Instant check-in/out logging with worked-hour precision, automated late status tagging past 09:15, and supervisor audit trail corrections.
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-slate-200 text-[11px] font-semibold text-slate-700 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Live Shift Tracking</span>
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shadow-sm">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Zero-Conflict RBAC Security</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Strict five-tiered role permissions ensuring confidential compensation data is completely isolated from non-payroll personnel.
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-slate-200 text-[11px] font-semibold text-slate-700 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>5-Tier Strict Isolation</span>
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shadow-sm">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Bank-Ready Disbursement</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    1-click bulk transfer CSV generation for corporate bank portals, automated pre-validation warning resolver, and ReportLab PDF payslips.
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-slate-200 text-[11px] font-semibold text-slate-700 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>1-Click Bank Registers</span>
                </div>
              </div>
            </div>

            {/* Key Metrics Counter Strip */}
            <div className="bg-slate-50 p-5 sm:p-6 rounded-2xl border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono">1,500+</div>
                <div className="text-[11px] text-slate-500 mt-1 font-semibold">Active Employees Managed</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono">99.98%</div>
                <div className="text-[11px] text-slate-500 mt-1 font-semibold">Punctuality Tracking Accuracy</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono">₹12.4 Cr+</div>
                <div className="text-[11px] text-slate-500 mt-1 font-semibold">Net Salaries Disbursed</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono">&lt; 1 Sec</div>
                <div className="text-[11px] text-slate-500 mt-1 font-semibold">Payroll Computation Speed</div>
              </div>
            </div>

            {/* Modal Bottom CTA */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsAboutOpen(false)}
                className="px-5 py-2.5 bg-black hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center space-x-1.5"
              >
                <span>Close</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── BLOG MODAL ─── */}
      {isBlogOpen && !selectedPost && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150"
          onClick={() => setIsBlogOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 relative space-y-8 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsBlogOpen(false)}
              className="absolute right-5 top-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors z-10"
              aria-label="Close blog modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                <BookOpen className="w-3.5 h-3.5 text-black" />
                <span>Workforce &amp; Payroll Insights</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Latest Articles from our HR Engineers
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Expert insights, legal tax breakdowns, and architectural best practices to help your organization scale cleanly.
              </p>
            </div>

            {/* 3 Blog Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {BLOG_POSTS.map((post) => (
                <article
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-subtle hover:border-slate-400 hover:shadow-elevated transition-all flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    {/* Article Thumbnail */}
                    <div className="relative h-40 w-full overflow-hidden bg-slate-100">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide">
                        {post.category}
                      </div>
                    </div>

                    {/* Article Body */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-medium">
                        <span>{post.date}</span>
                        <span>•</span>
                        <span>{post.readTime}</span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-slate-700 transition-colors line-clamp-2 leading-snug">
                        {post.title}
                      </h3>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="p-4 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                        {post.author.charAt(0)}
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold text-slate-900 leading-tight">{post.author}</div>
                        <div className="text-[10px] text-slate-400">{post.authorRole}</div>
                      </div>
                    </div>

                    <span className="inline-flex items-center text-xs font-semibold text-black group-hover:translate-x-0.5 transition-transform">
                      <span>Read</span>
                      <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── ARTICLE READER MODAL ─── */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto space-y-6 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedPost(null)}
              className="absolute right-5 top-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close article modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Post Header */}
            <div className="space-y-3">
              <div className="inline-flex items-center space-x-2 bg-slate-100 text-slate-800 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">
                <span>{selectedPost.category}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
                {selectedPost.title}
              </h2>
              <div className="flex items-center space-x-3 text-xs text-slate-400">
                <span className="font-medium text-slate-700">{selectedPost.author}</span>
                <span>•</span>
                <span>{selectedPost.date}</span>
                <span>•</span>
                <span>{selectedPost.readTime}</span>
              </div>
            </div>

            {/* Post Hero Image */}
            <div className="h-56 w-full rounded-2xl overflow-hidden bg-slate-100">
              <img
                src={selectedPost.image}
                alt={selectedPost.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Post Content */}
            <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
              {selectedPost.content.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            {/* Key Takeaways Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Key Takeaways</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {selectedPost.takeaways.map((point, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Modal Bottom CTA */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Back to Articles
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedPost(null);
                  setIsBlogOpen(false);
                }}
                className="px-4 py-2 bg-black hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center space-x-1.5"
              >
                <span>Continue Registration</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
