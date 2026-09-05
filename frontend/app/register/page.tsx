"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  Briefcase,
  Building2,
  CheckCircle2,
  Phone,
  Sparkles,
  Shield,
} from "lucide-react";
import { useAuth, UserRole } from "@/lib/auth-context";
import api from "@/lib/api";

interface RoleOption {
  role: UserRole;
  label: string;
  badge: string;
  description: string;
  permissions: string[];
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    role: "EMPLOYEE",
    label: "Employee (Self-Service)",
    badge: "Staff Member",
    description: "Personal self-service portal for attendance, leaves, and salary slips.",
    permissions: ["Clock In / Out Attendance", "View Personal Monthly Payslips", "Submit Leave Requests"],
  },
  {
    role: "HR_MANAGER",
    label: "HR Manager",
    badge: "People Ops Lead",
    description: "Oversee employee master directory, departments, and approve time-off.",
    permissions: ["Manage Employee Directory", "Approve / Refuse Leave Requests", "Manage Contracts & Departments"],
  },
  {
    role: "HR_PAYROLL_MANAGER",
    label: "Payroll Manager",
    badge: "Finance & Payroll Lead",
    description: "Generate monthly payruns, configure salary rules, validate & issue payments.",
    permissions: ["Compute & Validate Payruns", "Export Bank CSV Registers", "Full Salary Rule & Tax Formula Control"],
  },
  {
    role: "HR_PAYROLL_USER",
    label: "Payroll Officer",
    badge: "Payroll Operations",
    description: "Day-to-day payroll execution and payslip inspection with read-only rules.",
    permissions: ["Compute Payrun Batches", "Inspect Individual Payslips", "Review Attendance & Overtime"],
  },
  {
    role: "ADMIN",
    label: "System Administrator",
    badge: "Super Admin",
    description: "Unrestricted operational authority across all modules and audit configurations.",
    permissions: ["Full Multi-Module Control", "System Configuration & Overrides", "All HR & Payroll Privileges"],
  },
];

interface DepartmentItem {
  id: string;
  name: string;
  code: string;
}

export default function RegisterPage() {
  const { register } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole>("EMPLOYEE");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [phone, setPhone] = useState("");

  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // Fetch departments dynamically from backend
    const fetchOptions = async () => {
      try {
        const res = await api.get("/auth/options");
        if (res.data?.departments && res.data.departments.length > 0) {
          setDepartments(res.data.departments);
          setDepartmentId(res.data.departments[0].id);
        }
      } catch {
        // Fallback standard departments if options endpoint not reachable
        setDepartments([
          { id: "ENG", name: "Engineering & Tech", code: "ENG" },
          { id: "HR", name: "Human Resources", code: "HR" },
          { id: "SALES", name: "Sales & Revenue", code: "SALES" },
          { id: "MKT", name: "Growth & Marketing", code: "MKT" },
          { id: "FIN", name: "Finance & Legal", code: "FIN" },
        ]);
      }
    };
    fetchOptions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please re-enter.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      await register({
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        role: selectedRole,
        department_id: departmentId || undefined,
        job_title: jobTitle || undefined,
        phone: phone || undefined,
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
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-slate-50/50 flex flex-col justify-center">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Top Header Card */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-xl bg-gradient-to-tr from-odoo-purpleDark via-odoo-purple to-odoo-teal items-center justify-center text-white font-black text-2xl shadow-sm">
            P
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Join PeoplePay<span className="text-odoo-purple">360</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Select your organization role to automatically provision your isolated employee profile, running contract, and security permissions.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium flex items-center space-x-3 shadow-subtle animate-shake">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
            <div className="flex-1">
              <span className="font-bold block">Registration Error</span>
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. ROLE SELECTION CARDS */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-odoo-purple" />
                  <span>Step 1: Choose Your Role & Persona</span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  Access permissions and interface views dynamically adjust based on your chosen role.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-odoo-purple bg-purple-50 px-2.5 py-1 rounded-full border border-odoo-purple/20">
                5 Roles Available
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {ROLE_OPTIONS.map((item) => {
                const isSelected = selectedRole === item.role;
                return (
                  <div
                    key={item.role}
                    onClick={() => setSelectedRole(item.role)}
                    className={`cursor-pointer rounded-xl border p-4 transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? "bg-purple-50/40 border-odoo-purple shadow-sm ring-2 ring-odoo-purple/20"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          {item.badge}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-odoo-purple" />
                        )}
                      </div>
                      <h3 className="text-xs font-bold text-slate-900 mb-1">
                        {item.label}
                      </h3>
                      <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                        {item.description}
                      </p>
                    </div>

                    <div className="border-t border-slate-100 pt-2 space-y-1">
                      {item.permissions.map((perm, idx) => (
                        <div key={idx} className="flex items-center space-x-1.5 text-[10px] text-slate-600">
                          <span className="w-1 h-1 rounded-full bg-odoo-purple"></span>
                          <span>{perm}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. ACCOUNT & PERSONAL INFORMATION */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-5 sm:p-6 space-y-5">
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <User className="w-4 h-4 text-odoo-purple" />
              <span>Step 2: Profile & Account Credentials</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* First Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rachel"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple"
                  />
                </div>
              </div>

              {/* Last Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Green"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="rachel.green@peoplepay.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple font-mono"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Department & Job Title */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-100">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Assigned Department
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple cursor-pointer"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Job Title / Designation (Optional)
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. Senior Specialist"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Zero Conflict Auto-Provisioning Notice */}
          <div className="p-4 bg-gradient-to-r from-purple-50 via-slate-50 to-teal-50/40 border border-purple-100 rounded-2xl text-xs text-slate-700 space-y-1">
            <div className="flex items-center space-x-2 text-odoo-purple font-bold">
              <Sparkles className="w-4 h-4" />
              <span>Zero Conflict Architecture Guarantee</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Upon submitting, our system automatically provisions an isolated <b>Employee ID</b>, a <b>Running Contract</b>, and <b>20 Annual Leave Days</b> in MongoDB Atlas. Your personal records and attendance logs will never collide with other users.
            </p>
          </div>

          {/* Action Button & Sign In Link */}
          <div className="space-y-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-odoo-purple hover:bg-odoo-purpleHover text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50 text-sm"
            >
              <span>{loading ? "Provisioning Your Account..." : "Create Account & Launch Workspace"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center">
              <p className="text-xs text-slate-500">
                Already registered with an existing account?{" "}
                <Link
                  href="/login"
                  className="font-bold text-odoo-purple hover:underline"
                >
                  Sign In to Workspace
                </Link>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
