"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Printer,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";
import api, { getPayslipPdfUrl } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function PayslipDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [payslip, setPayslip] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchPayslip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchPayslip = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/payslips/${id}`);
      setPayslip(res.data);
    } catch (err) {
      console.error("Failed to load payslip:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-xs text-slate-500">Loading payslip computation...</div>;
  }

  if (!payslip) {
    return <div className="p-8 text-xs text-rose-500">Payslip record not found.</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-subtle">
        <div className="flex items-center space-x-3">
          <Link
            href="/payroll"
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <span>Payslip: {payslip.payslip_number}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                {payslip.status}
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Period: {formatDate(payslip.period_start)} to {formatDate(payslip.period_end)}
            </p>
          </div>
        </div>

        {/* PRINT / PREVIEW PDF BUTTON ONLY */}
        <a
          href={getPayslipPdfUrl(payslip.id, false)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center space-x-2 px-4 py-2 bg-black hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          title="Open PDF Preview in new tab"
        >
          <Printer className="w-4 h-4 text-white" />
          <span>Print / Preview PDF</span>
        </a>
      </div>

      {/* Warnings Banner if any */}
      {payslip.warnings && payslip.warnings.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center space-x-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-amber-900">Pre-Validation Audit Warnings</h3>
          </div>
          <ul className="list-disc list-inside text-xs text-amber-800 space-y-0.5">
            {payslip.warnings.map((w: string, idx: number) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Employee & Period Information Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-slate-400 block mb-0.5">Employee Name</span>
          <span className="font-bold text-slate-900 text-sm">{payslip.employee_name}</span>
          <span className="text-[10px] text-slate-500 font-mono block">{payslip.employee_code}</span>
        </div>
        <div>
          <span className="text-slate-400 block mb-0.5">Active Contract</span>
          <span className="font-semibold text-slate-800 font-mono">{payslip.contract_code}</span>
          <span className="text-[10px] text-emerald-600 font-bold block">Base: {formatCurrency(payslip.wage)}</span>
        </div>
        <div>
          <span className="text-slate-400 block mb-0.5">Worked Days</span>
          <span className="font-bold text-slate-900 text-sm">{payslip.worked_days} Days</span>
          <span className="text-[10px] text-slate-500 block">Standard 22 Working Days</span>
        </div>
        <div>
          <span className="text-slate-400 block mb-0.5">Unpaid Leaves</span>
          <span className="font-bold text-rose-600 text-sm">{payslip.unpaid_leave_days} Days</span>
          <span className="text-[10px] text-slate-500 block">Deducted from Gross</span>
        </div>
      </div>

      {/* COMPUTED SALARY RULE BREAKDOWN TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-subtle overflow-x-auto">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between min-w-[650px]">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Sequential Salary Computation Lines
          </h2>
          <span className="text-[11px] font-semibold text-odoo-purple">Executed via Python AST Engine</span>
        </div>

        <table className="w-full min-w-[650px] text-left text-xs text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Seq</th>
              <th className="px-4 py-3">Rule Name</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Calculation Details</th>
              <th className="px-4 py-3 text-right">Computed Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {payslip.lines?.map((line: any, idx: number) => {
              const isGross = line.category === "GROSS";
              const isNet = line.category === "NET";
              const isDed = line.category === "DEDUCTION";
              return (
                <tr
                  key={idx}
                  className={`transition-colors ${
                    isNet
                      ? "bg-emerald-50/50 font-bold"
                      : isGross
                      ? "bg-blue-50/40 font-bold"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <td className="px-4 py-3 text-slate-400">{line.sequence}</td>
                  <td className="px-4 py-3 font-sans font-bold text-slate-900">{line.rule_name}</td>
                  <td className="px-4 py-3 text-slate-600">{line.rule_code}</td>
                  <td className="px-4 py-3 font-sans">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        line.category === "BASIC"
                          ? "bg-purple-100 text-odoo-purple"
                          : line.category === "ALLOWANCE"
                          ? "bg-blue-100 text-blue-800"
                          : isGross
                          ? "bg-indigo-100 text-indigo-800"
                          : isDed
                          ? "bg-rose-100 text-rose-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {line.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-sans text-[11px]">
                    {line.calculation_note || "-"}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-bold text-sm ${
                      isNet
                        ? "text-emerald-700 font-black"
                        : isDed
                        ? "text-rose-600"
                        : "text-slate-900"
                    }`}
                  >
                    {isDed ? `-${formatCurrency(line.amount)}` : formatCurrency(line.amount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Summary Footer */}
        <div className="bg-slate-50 p-5 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-xs text-slate-500 space-y-1">
            <p>Total Gross Earnings: <b>{formatCurrency(payslip.gross_salary)}</b></p>
            <p>Total Deductions: <b className="text-rose-600">-{formatCurrency(payslip.total_deductions)}</b></p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-emerald-300 shadow-sm text-right">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Net Take-Home Pay</span>
            <span className="text-xl font-black text-emerald-700">{formatCurrency(payslip.net_salary)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
