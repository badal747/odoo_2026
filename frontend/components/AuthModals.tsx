"use client";

import React, { useEffect } from "react";
import {
  X,
  Shield,
  CreditCard,
  Clock,
  FileSpreadsheet,
  BookOpen,
} from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-md">
            P
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                PeoplePay<span className="text-odoo-purple">360</span>
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-odoo-purple border border-purple-200/60 px-2 py-0.5 rounded-full">
                Enterprise v1.0
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Integrated HR & Automated Statutory Payroll Platform
            </p>
          </div>
        </div>

        {/* Overview */}
        <p className="text-xs text-slate-600 leading-relaxed">
          PeoplePay360 is built for the <b>Odoo Combat Hackathon 2026</b> to deliver end-to-end workforce lifecycle governance: employee master directories, biometric attendance clocking, leave quotas, and a dynamic statutory payroll calculation engine.
        </p>

        {/* 4 Architectural Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center space-x-1.5 text-slate-900 font-bold text-xs">
              <CreditCard className="w-4 h-4 text-odoo-purple" />
              <span>Dynamic Salary Rules</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              Formula expressions for Basic, HRA, PF (12%), PT, and progressive TDS deductions.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center space-x-1.5 text-slate-900 font-bold text-xs">
              <Shield className="w-4 h-4 text-teal-600" />
              <span>Zero-Conflict RBAC</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              5 security tiers (Admin, HR, Payroll, Employee) with isolated profile provisioning.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center space-x-1.5 text-slate-900 font-bold text-xs">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Time Off & Attendance</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              Biometric check-in/out, leave allocations, and automated unpaid leave deductions.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center space-x-1.5 text-slate-900 font-bold text-xs">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <span>Bank CSV Register</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              1-click export of salary payment batch CSV with IFSC and account validation.
            </p>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Engineered With Modern Cloud Stack
          </span>
          <div className="flex flex-wrap gap-1.5">
            {["FastAPI (Python 3.11)", "MongoDB Atlas", "Beanie ODM", "Next.js 14", "TailwindCSS", "Three.js Canvas", "JWT Auth"].map((tech) => (
              <span
                key={tech}
                className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200/60"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
        >
          Close Information
        </button>
      </div>
    </div>
  );
}

export function DocumentationModal({ isOpen, onClose }: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-odoo-purple text-white flex items-center justify-center font-black text-xl shadow-md">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Payroll Engine Documentation & Guide
            </h3>
            <p className="text-xs text-slate-500">
              Technical Overview of Payrun Stages, Salary Rule Formulas & RBAC
            </p>
          </div>
        </div>

        {/* Section 1: Payrun State Machine */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-odoo-purple"></span>
            <span>1. The 4-Stage Payrun Workflow</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Stage 1</span>
              <b className="text-slate-800">DRAFT</b>
              <p className="text-[10px] text-slate-500 mt-1">Batch initialized for active contracts.</p>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-odoo-purple">
              <span className="text-[10px] font-bold text-purple-400 block uppercase">Stage 2</span>
              <b className="text-odoo-purple">COMPUTED</b>
              <p className="text-[10px] text-purple-700/80 mt-1">Evaluates rules, leaves & prorating.</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
              <span className="text-[10px] font-bold text-amber-400 block uppercase">Stage 3</span>
              <b className="text-amber-800">VALIDATED</b>
              <p className="text-[10px] text-amber-700/80 mt-1">Audit verification & figures locked.</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
              <span className="text-[10px] font-bold text-emerald-400 block uppercase">Stage 4</span>
              <b className="text-emerald-800">PAID</b>
              <p className="text-[10px] text-emerald-700/80 mt-1">1-click Bank CSV Exported & closed.</p>
            </div>
          </div>
        </div>

        {/* Section 2: Statutory Indian Salary Rules */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-odoo-teal"></span>
            <span>2. Statutory Salary Rules & Formulas</span>
          </h4>
          <div className="p-3.5 rounded-2xl bg-slate-900 text-slate-200 font-mono text-[11px] space-y-1 overflow-x-auto">
            <div><span className="text-purple-300">BASIC</span> = WAGE * 50%</div>
            <div><span className="text-teal-300">HRA</span>   = BASIC * 40%</div>
            <div><span className="text-teal-300">CONV</span>  = ₹1,600 (Fixed Allowance)</div>
            <div><span className="text-teal-300">MED</span>   = ₹1,250 (Fixed Allowance)</div>
            <div className="text-slate-400 pt-1 border-t border-slate-800"># Deductions</div>
            <div><span className="text-rose-300">PF</span>    = BASIC * 12% (Provident Fund)</div>
            <div><span className="text-rose-300">PT</span>    = ₹200 (Professional Tax)</div>
            <div><span className="text-rose-300">TDS</span>   = (GROSS &gt; 50000) * (GROSS - 50000) * 10%</div>
            <div><span className="text-rose-300">UNPAID</span>= (GROSS / Total_Days) * Unpaid_Leave_Days</div>
            <div className="text-emerald-400 font-bold pt-1 border-t border-slate-800">NET = max(0.0, GROSS - TOTAL_DEDUCTIONS)</div>
          </div>
        </div>

        {/* Section 3: Role Scoping Summary */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-900"></span>
            <span>3. Role Privileges & Permissions</span>
          </h4>
          <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-2.5">Role</th>
                  <th className="p-2.5">Allowed Modules</th>
                  <th className="p-2.5">Key Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px] text-slate-600">
                <tr>
                  <td className="p-2.5 font-bold text-slate-900">Employee</td>
                  <td className="p-2.5">Dashboard, Attendance, Time Off</td>
                  <td className="p-2.5">Check in/out, view personal payslips, submit leave</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-slate-900">HR Manager</td>
                  <td className="p-2.5">Employees, Contracts, Attendance, Time Off</td>
                  <td className="p-2.5">Onboard staff, approve leaves, manage departments</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-slate-900">Payroll Mgr</td>
                  <td className="p-2.5">Payroll, Salary Rules, Contracts, Attendance</td>
                  <td className="p-2.5">Compute payruns, validate payslips, export bank CSV</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-slate-900">Admin</td>
                  <td className="p-2.5">All Modules (Unrestricted)</td>
                  <td className="p-2.5">Full system management, overrides & configuration</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
        >
          Close Documentation
        </button>
      </div>
    </div>
  );
}
