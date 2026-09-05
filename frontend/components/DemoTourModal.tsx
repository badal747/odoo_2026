"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  X,
  Compass,
  Sparkles,
  CreditCard,
  Calendar,
  ShieldCheck,
  FileSpreadsheet,
  Mail,
  Zap,
  ChevronRight
} from "lucide-react";

interface DemoTourModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DemoTourModal({ isOpen, onClose }: DemoTourModalProps) {
  const [activeTab, setActiveTab] = useState<"scenario1" | "scenario2" | "roadmap">("scenario1");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-floating border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-odoo-purpleDark via-odoo-purple to-odoo-teal p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Compass className="w-5 h-5 text-amber-300 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold">Hackathon Demo & Evaluation Guide</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-900">
                  Odoo 2026
                </span>
              </div>
              <p className="text-xs text-white/80 mt-0.5">
                Complete walkthrough of required end-to-end user journeys (PDF Section 8)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab("scenario1")}
            className={`pb-3 flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === "scenario1"
                ? "border-odoo-purple text-odoo-purple"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Scenario 1: Employee to Payslip</span>
          </button>
          <button
            onClick={() => setActiveTab("scenario2")}
            className={`pb-3 flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === "scenario2"
                ? "border-odoo-purple text-odoo-purple"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Scenario 2: Leave & Allocation</span>
          </button>
          <button
            onClick={() => setActiveTab("roadmap")}
            className={`pb-3 flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === "roadmap"
                ? "border-odoo-purple text-odoo-purple"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Future Roadmap & Extensibility</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 max-h-[60vh]">
          {/* TAB 1: SCENARIO 1 */}
          {activeTab === "scenario1" && (
            <div className="space-y-4">
              <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl text-xs text-purple-900 leading-relaxed">
                <span className="font-bold">Scenario 1 Objective:</span> Walk from creating/viewing an employee, validating contracts and attendance logs, executing a 2-step payrun batch, resolving pre-validation audit warnings, and executing simulated PDF email dispatch.
              </div>

              <div className="space-y-3">
                {/* Step 1 */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-subtle hover:border-slate-300 transition-all flex items-start space-x-3.5">
                  <div className="w-7 h-7 rounded-full bg-odoo-purple text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-900">Inspect Employee & Running Contract</h3>
                      <Link
                        href="/employees"
                        onClick={onClose}
                        className="text-[11px] font-semibold text-odoo-purple hover:underline flex items-center space-x-0.5"
                      >
                        <span>Open Employees</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Check employee directory with smart badge counts (Contracts, Payslips, Time-off days). Notice Eva Green (EMP005) who has missing bank details to trigger warning checks.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-subtle hover:border-slate-300 transition-all flex items-start space-x-3.5">
                  <div className="w-7 h-7 rounded-full bg-odoo-purple text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-900">Live Attendance & Overtime Synchronization</h3>
                      <Link
                        href="/attendance"
                        onClick={onClose}
                        className="text-[11px] font-semibold text-odoo-purple hover:underline flex items-center space-x-0.5"
                      >
                        <span>Open Attendance</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      View real-time check-ins, late penalties, and half-day computations that dynamically calculate worked days for payroll formulas.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-subtle hover:border-slate-300 transition-all flex items-start space-x-3.5">
                  <div className="w-7 h-7 rounded-full bg-odoo-purple text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-900">2-Step Payrun Wizard & Dynamic Rule Execution</h3>
                      <Link
                        href="/payroll"
                        onClick={onClose}
                        className="text-[11px] font-semibold text-odoo-purple hover:underline flex items-center space-x-0.5"
                      >
                        <span>Open Payrun Hub</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Click <b>New Payrun Wizard</b>. Step 1 selects structure and dates; Step 2 filters eligible staff. Click <b>Compute Payslips</b> to execute Python AST formulas (Basic, HRA, PF, PT, TDS).
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-subtle hover:border-slate-300 transition-all flex items-start space-x-3.5">
                  <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    4
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xs font-bold text-slate-900">Pre-Validation Warning Resolver (1-Click Fix)</h3>
                    <p className="text-[11px] text-slate-500 mt-1">
                      In the payslips table, notice the amber badge on Eva Green (&quot;Missing bank account number&quot;). Click <b>Resolve</b> to open the drawer, hit <b>Auto-fill Standard Bank Details</b>, and submit. The warning vanishes instantaneously!
                    </p>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-subtle hover:border-slate-300 transition-all flex items-start space-x-3.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    5
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xs font-bold text-slate-900">Batch Validation, Mark Paid & Bulk Email Simulator</h3>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Click <b>Validate Batch</b> &rarr; <b>Mark Paid (Disburse)</b> with celebratory confetti. Then click <b>Send Payslips (Bulk Email)</b> to launch the live delivery drawer and view the branded HTML payslip email preview!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SCENARIO 2 */}
          {activeTab === "scenario2" && (
            <div className="space-y-4">
              <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-xl text-xs text-teal-900 leading-relaxed">
                <span className="font-bold">Scenario 2 Objective:</span> End-to-end Time Off workflow: from submission of Paid / Unpaid leave, manager approval workflow, automatic allocation deduction, and automated payroll deduction propagation.
              </div>

              <div className="space-y-3">
                {/* Step 1 */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-subtle hover:border-slate-300 transition-all flex items-start space-x-3.5">
                  <div className="w-7 h-7 rounded-full bg-odoo-teal text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-900">Time Off Balance & Allocation Grid</h3>
                      <Link
                        href="/time-off"
                        onClick={onClose}
                        className="text-[11px] font-semibold text-odoo-teal hover:underline flex items-center space-x-0.5"
                      >
                        <span>Open Time Off Portal</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Check allocated Paid Time Off (PTO, 20 days), Sick Leave, and Unpaid Leave. Balances update in real time when requests are approved.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-subtle hover:border-slate-300 transition-all flex items-start space-x-3.5">
                  <div className="w-7 h-7 rounded-full bg-odoo-teal text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xs font-bold text-slate-900">Request Submission & Overlapping Validation</h3>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Click <b>Request Time Off</b>. Try selecting dates that collide with an existing approved request to see automated collision prevention and holiday validations.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-subtle hover:border-slate-300 transition-all flex items-start space-x-3.5">
                  <div className="w-7 h-7 rounded-full bg-odoo-teal text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xs font-bold text-slate-900">Manager Approval & Payroll Unpaid Deduction</h3>
                    <p className="text-[11px] text-slate-500 mt-1">
                      As HR Manager, approve or reject pending requests. If an employee takes Unpaid Leave, the payroll calculation engine automatically deducts the proportionate daily rate: <code>(GROSS / total_days) * unpaid_days</code>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FUTURE ROADMAP */}
          {activeTab === "roadmap" && (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                <span className="font-bold">Extensibility & Production Vision:</span> Key enterprise capabilities planned for post-hackathon deployment (PDF Page 10, Section 8).
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-subtle">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-odoo-purple flex items-center justify-center mb-2">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">AI Shift & Anomaly Detector</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Automated anomaly detection for buddy punching, unusual overtime bursts, and predicted burnouts based on historical attendance patterns.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-subtle">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-odoo-teal flex items-center justify-center mb-2">
                    <Mail className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">WhatsApp & Slack Bot Delivery</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Interactive conversational bot enabling employees to type <code>/payslip</code> or <code>/apply-leave</code> directly in Slack or WhatsApp with zero UI friction.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-subtle">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Multi-Country Tax Localization</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Pluggable rule packs for US (W-2/401k), UK (PAYE/National Insurance), and Middle East (WPS compliance) with real-time multi-currency conversions.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-subtle">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Government Portal Integrations</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Direct electronic filing of EPFO, ESIC, and Form 16 XML/JSON packets into government tax gateways with cryptographic audit stamps.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>MongoDB Atlas Production Cluster Live</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-odoo-purple hover:bg-odoo-purpleHover text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            Got it, Let&apos;s Explore!
          </button>
        </div>
      </div>
    </div>
  );
}
