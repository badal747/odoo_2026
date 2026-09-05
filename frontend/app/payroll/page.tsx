"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CreditCard,
  Plus,
  Play,
  CheckCircle2,
  AlertTriangle,
  Send,
  Printer,
  Calendar,
  Layers,
  Users,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  X,
  ExternalLink,
  Lock
} from "lucide-react";
import api from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import confetti from "canvas-confetti";

export default function PayrollPage() {
  const [payruns, setPayruns] = useState<any[]>([]);
  const [selectedPayrun, setSelectedPayrun] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [structures, setStructures] = useState<any[]>([]);

  // TWO-STEP WIZARD MODAL STATE (Section B5 in PDF)
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [wizardScope, setWizardScope] = useState({
    name: "March 2026 Regular Payroll",
    salary_structure_id: "",
    period_start: "2026-03-01",
    period_end: "2026-03-31",
  });
  const [eligibleStaff, setEligibleStaff] = useState<any[]>([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [wizardLoading, setWizardLoading] = useState(false);

  // Email action toast
  const [emailStatusMsg, setEmailStatusMsg] = useState("");

  useEffect(() => {
    fetchPayruns();
  }, []);

  const fetchPayruns = async () => {
    try {
      setLoading(true);
      const [pRes, sRes] = await Promise.all([
        api.get("/payruns"),
        api.get("/payroll-config/structures"),
      ]);
      setPayruns(pRes.data);
      setStructures(sRes.data);

      if (sRes.data.length > 0) {
        setWizardScope((prev) => ({ ...prev, salary_structure_id: sRes.data[0].id }));
      }
      if (pRes.data.length > 0) {
        loadPayrunDetails(pRes.data[0].id);
      }
    } catch (err) {
      console.error("Failed to load payroll batches:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadPayrunDetails = async (id: string) => {
    try {
      const res = await api.get(`/payruns/${id}`);
      setSelectedPayrun(res.data);
    } catch (err) {
      console.error("Failed to load payrun details:", err);
    }
  };

  // ---------------- WIZARD STEP 1 -> STEP 2 ----------------
  const handleWizardStep1Continue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setWizardLoading(true);
      const res = await api.post("/payruns/wizard-eligible", {
        salary_structure_id: wizardScope.salary_structure_id,
        period_start: new Date(wizardScope.period_start).toISOString(),
        period_end: new Date(wizardScope.period_end).toISOString(),
      });
      setEligibleStaff(res.data.employees || []);
      // Default: select all eligible employees
      setSelectedEmpIds((res.data.employees || []).map((e: any) => e.employee_id));
      setWizardStep(2);
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to check employee eligibility");
    } finally {
      setWizardLoading(false);
    }
  };

  // ---------------- WIZARD STEP 2: CREATE BATCH ----------------
  const handleCreatePayrunBatch = async () => {
    if (selectedEmpIds.length === 0) {
      alert("Please select at least one employee");
      return;
    }
    try {
      setWizardLoading(true);
      const res = await api.post("/payruns/create-batch", {
        name: wizardScope.name,
        salary_structure_id: wizardScope.salary_structure_id,
        period_start: new Date(wizardScope.period_start).toISOString(),
        period_end: new Date(wizardScope.period_end).toISOString(),
        selected_employee_ids: selectedEmpIds,
      });
      setIsWizardOpen(false);
      setWizardStep(1);
      fetchPayruns();
      loadPayrunDetails(res.data.id);
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to create payrun batch");
    } finally {
      setWizardLoading(false);
    }
  };

  // ---------------- PROCESSING ACTIONS ----------------
  const handleCompute = async () => {
    if (!selectedPayrun) return;
    try {
      await api.post(`/payruns/${selectedPayrun.id}/compute`);
      loadPayrunDetails(selectedPayrun.id);
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Compute failed");
    }
  };

  const handleValidate = async () => {
    if (!selectedPayrun) return;
    try {
      await api.post(`/payruns/${selectedPayrun.id}/validate`);
      loadPayrunDetails(selectedPayrun.id);
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Validation failed");
    }
  };

  const handleMarkPaid = async () => {
    if (!selectedPayrun) return;
    try {
      await api.post(`/payruns/${selectedPayrun.id}/mark-paid`);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      loadPayrunDetails(selectedPayrun.id);
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Mark paid failed");
    }
  };

  const handleSendEmails = async () => {
    if (!selectedPayrun) return;
    try {
      const res = await api.post(`/payruns/${selectedPayrun.id}/send-emails`);
      setEmailStatusMsg(res.data.message);
      setTimeout(() => setEmailStatusMsg(""), 6000);
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Email dispatch failed");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-subtle">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-odoo-purple" />
            <span>Payroll Operations & Payrun Hub</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Two-step Payrun setup wizard, sequential salary computation, warning audits, validation and bulk PDF delivery.
          </p>
        </div>

        <button
          onClick={() => {
            setWizardStep(1);
            setIsWizardOpen(true);
          }}
          className="flex items-center space-x-1.5 px-4 py-2 bg-odoo-purple hover:bg-odoo-purpleHover text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Payrun Wizard</span>
        </button>
      </div>

      {/* Main Grid: Left side Payrun list, Right side Payrun Processing Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Payrun Batches */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Payroll Batches</h2>
          {payruns.map((p) => {
            const isSelected = selectedPayrun && selectedPayrun.id === p.id;
            const isPaid = p.status === "PAID";
            return (
              <div
                key={p.id}
                onClick={() => loadPayrunDetails(p.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? "bg-purple-50/60 border-odoo-purple shadow-sm"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-xs font-bold text-slate-900">{p.name}</h3>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isPaid
                        ? "bg-emerald-100 text-emerald-800"
                        : p.status === "COMPUTED"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {formatDate(p.period_start)} &rarr; {formatDate(p.period_end)}
                </p>
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">{p.total_employees} Employees</span>
                  <span className="font-bold text-slate-900">{formatCurrency(p.total_net)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: PAYRUN PROCESSING HUB */}
        <div className="lg:col-span-3 space-y-5">
          {selectedPayrun ? (
            <>
              {/* Payrun Action Bar & Status */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base font-bold text-slate-900">{selectedPayrun.name}</h2>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-purple-100 text-odoo-purple">
                      {selectedPayrun.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Structure: <b>{selectedPayrun.structure_name}</b> &bull; Period: {formatDate(selectedPayrun.period_start)} to {formatDate(selectedPayrun.period_end)}
                  </p>
                </div>

                {/* Workflow Lifecycle Action Buttons (Section B6 in PDF) */}
                <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                  {selectedPayrun.status === "DRAFT" && (
                    <button
                      onClick={handleCompute}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center space-x-1.5"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Compute Payslips</span>
                    </button>
                  )}

                  {selectedPayrun.status === "COMPUTED" && (
                    <>
                      <button
                        onClick={handleCompute}
                        className="px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold"
                      >
                        Recompute
                      </button>
                      <button
                        onClick={handleValidate}
                        className="px-3.5 py-1.5 bg-odoo-purple hover:bg-odoo-purpleHover text-white rounded-lg text-xs font-semibold shadow-sm flex items-center space-x-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Validate Batch</span>
                      </button>
                    </>
                  )}

                  {selectedPayrun.status === "VALIDATED" && (
                    <button
                      onClick={handleMarkPaid}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center space-x-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Mark Paid (Disburse)</span>
                    </button>
                  )}

                  {selectedPayrun.status === "PAID" && (
                    <button
                      onClick={handleSendEmails}
                      className="px-3.5 py-1.5 bg-odoo-teal hover:bg-odoo-tealHover text-white rounded-lg text-xs font-semibold shadow-sm flex items-center space-x-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Payslips (Bulk Email)</span>
                    </button>
                  )}
                </div>
              </div>

              {emailStatusMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center space-x-2 animate-bounce">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{emailStatusMsg}</span>
                </div>
              )}

              {/* Summary Metrics Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Total Staff</p>
                  <p className="text-base font-bold text-slate-800">{selectedPayrun.total_employees}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Total Gross</p>
                  <p className="text-base font-bold text-slate-800">{formatCurrency(selectedPayrun.total_gross)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Total Deductions</p>
                  <p className="text-base font-bold text-rose-600">-{formatCurrency(selectedPayrun.total_deductions)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-emerald-700">Net Take-Home</p>
                  <p className="text-base font-bold text-emerald-700">{formatCurrency(selectedPayrun.total_net)}</p>
                </div>
              </div>

              {/* Payslip Lines Summary Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-subtle">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Slip #</th>
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Worked Days</th>
                      <th className="px-4 py-3">Gross</th>
                      <th className="px-4 py-3">Deductions</th>
                      <th className="px-4 py-3">Net Payable</th>
                      <th className="px-4 py-3">Warnings</th>
                      <th className="px-4 py-3 text-right">Payslip PDF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedPayrun.payslips?.map((slip: any) => (
                      <tr key={slip.id} className="hover:bg-purple-50/20 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-slate-800">{slip.payslip_number}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {slip.employee_name}
                          <span className="block text-[10px] text-slate-400 font-normal">{slip.employee_code}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{slip.worked_days} Days</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{formatCurrency(slip.gross_salary)}</td>
                        <td className="px-4 py-3 font-semibold text-rose-600">
                          {slip.total_deductions > 0 ? `-${formatCurrency(slip.total_deductions)}` : "₹0.00"}
                        </td>
                        <td className="px-4 py-3 font-bold text-emerald-700">{formatCurrency(slip.net_salary)}</td>
                        <td className="px-4 py-3">
                          {slip.warnings && slip.warnings.length > 0 ? (
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center space-x-1 inline-flex"
                              title={slip.warnings.join(", ")}
                            >
                              <AlertTriangle className="w-3 h-3" />
                              <span>{slip.warnings.length} Issues</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-600 font-medium flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Verified</span>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <Link
                            href={`/payroll/payslips/${slip.id}`}
                            className="text-odoo-purple font-semibold hover:underline inline-flex items-center space-x-1"
                          >
                            <span>Inspect</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                          <a
                            href={`http://localhost:8000/api/v1/payslips/${slip.id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 inline-block align-middle"
                            title="Print PDF"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400">
              Select or create a Payrun batch to begin.
            </div>
          )}
        </div>
      </div>

      {/* TWO-STEP PAYRUN CREATION WIZARD MODAL (Mandatory PDF Section B5) */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-floating border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            {/* Wizard Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Payrun Setup Wizard</h2>
                <p className="text-xs text-slate-400">
                  Step {wizardStep} of 2 &bull; {wizardStep === 1 ? "Define Batch Scope" : "Select Eligible Employees"}
                </p>
              </div>
              <button onClick={() => setIsWizardOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Indicator */}
            <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center space-x-4 text-xs font-semibold">
              <div className={`flex items-center space-x-1.5 ${wizardStep === 1 ? "text-odoo-purple" : "text-emerald-600"}`}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center border text-[11px] font-bold">1</span>
                <span>Scope & Period</span>
              </div>
              <div className="w-8 h-px bg-slate-300" />
              <div className={`flex items-center space-x-1.5 ${wizardStep === 2 ? "text-odoo-purple" : "text-slate-400"}`}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center border text-[11px] font-bold">2</span>
                <span>Employee Selection</span>
              </div>
            </div>

            {/* STEP 1: DEFINE SCOPE */}
            {wizardStep === 1 && (
              <form onSubmit={handleWizardStep1Continue} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Payrun Batch Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="March 2026 Regular Payroll"
                    value={wizardScope.name}
                    onChange={(e) => setWizardScope({ ...wizardScope, name: e.target.value })}
                    className="w-full p-2 border rounded-lg font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Salary Structure *</label>
                  <select
                    required
                    value={wizardScope.salary_structure_id}
                    onChange={(e) => setWizardScope({ ...wizardScope, salary_structure_id: e.target.value })}
                    className="w-full p-2 border rounded-lg font-medium"
                  >
                    {structures.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Period Start *</label>
                    <input
                      type="date"
                      required
                      value={wizardScope.period_start}
                      onChange={(e) => setWizardScope({ ...wizardScope, period_start: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Period End *</label>
                    <input
                      type="date"
                      required
                      value={wizardScope.period_end}
                      onChange={(e) => setWizardScope({ ...wizardScope, period_end: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-[11px]">
                  <b>Note:</b> Clicking Continue queries for all employees holding an active (RUNNING) contract valid during this period without creating a database record.
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsWizardOpen(false)}
                    className="px-3 py-2 border rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={wizardLoading}
                    className="px-4 py-2 bg-odoo-purple hover:bg-odoo-purpleHover text-white rounded-lg font-semibold flex items-center space-x-1"
                  >
                    <span>Continue to Staff Selection</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: SELECT ELIGIBLE EMPLOYEES */}
            {wizardStep === 2 && (
              <div className="p-6 space-y-4 text-xs overflow-y-auto">
                <div className="flex items-center justify-between">
                  <p className="text-slate-600">
                    Found <b>{eligibleStaff.length} eligible employees</b> with period-valid contracts. Explicitly select staff to include:
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedEmpIds.length === eligibleStaff.length) {
                        setSelectedEmpIds([]);
                      } else {
                        setSelectedEmpIds(eligibleStaff.map((e) => e.employee_id));
                      }
                    }}
                    className="text-odoo-purple font-semibold hover:underline"
                  >
                    {selectedEmpIds.length === eligibleStaff.length ? "Deselect All" : "Select All"}
                  </button>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl max-h-60 overflow-y-auto">
                  {eligibleStaff.map((emp) => {
                    const isChecked = selectedEmpIds.includes(emp.employee_id);
                    return (
                      <label
                        key={emp.employee_id}
                        className="flex items-center justify-between p-3 hover:bg-slate-50 cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedEmpIds([...selectedEmpIds, emp.employee_id]);
                              } else {
                                setSelectedEmpIds(selectedEmpIds.filter((id) => id !== emp.employee_id));
                              }
                            }}
                            className="w-4 h-4 text-odoo-purple rounded border-slate-300"
                          />
                          <div>
                            <p className="font-bold text-slate-900">{emp.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {emp.employee_code} &bull; Contract: {emp.contract_code}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-bold text-slate-900">{formatCurrency(emp.wage)}</p>
                          {!emp.has_bank_details && (
                            <span className="text-[10px] text-amber-600 font-bold">⚠️ No Bank Info</span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="px-3 py-2 border rounded-lg font-semibold flex items-center space-x-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Scope</span>
                  </button>
                  <button
                    type="button"
                    disabled={wizardLoading || selectedEmpIds.length === 0}
                    onClick={handleCreatePayrunBatch}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center space-x-1 shadow-sm"
                  >
                    <span>Create Payrun ({selectedEmpIds.length} Selected)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
