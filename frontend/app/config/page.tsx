"use client";

import React, { useState, useEffect } from "react";
import {
  Sliders,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Code,
  Percent,
  DollarSign,
  HelpCircle,
  X,
  Layers,
  Lock
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function SalaryConfigPage() {
  const { hasRole } = useAuth();
  const canEditRules = hasRole(["ADMIN", "HR_PAYROLL_MANAGER"]);

  const [structures, setStructures] = useState<any[]>([]);
  const [selectedStructure, setSelectedStructure] = useState<any>(null);
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Rule Modal
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    name: "",
    code: "",
    category: "ALLOWANCE",
    sequence: 50,
    computation_type: "PERCENTAGE",
    fixed_amount: 0,
    percentage: 10,
    percentage_base_code: "BASIC",
    formula_expression: "",
  });

  useEffect(() => {
    fetchStructures();
  }, []);

  const fetchStructures = async () => {
    try {
      setLoading(true);
      const res = await api.get("/payroll-config/structures");
      setStructures(res.data);
      if (res.data.length > 0) {
        loadStructureDetails(res.data[0].id);
      }
    } catch (err) {
      console.error("Failed to load salary structures:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadStructureDetails = async (id: string) => {
    try {
      const res = await api.get(`/payroll-config/structures/${id}`);
      setSelectedStructure(res.data);
      setRules(res.data.rules || []);
    } catch (err) {
      console.error("Failed to load structure rules:", err);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStructure) return;
    try {
      await api.post("/payroll-config/rules", {
        ...ruleForm,
        structure_id: selectedStructure.id,
        sequence: Number(ruleForm.sequence),
        fixed_amount: Number(ruleForm.fixed_amount),
        percentage: Number(ruleForm.percentage),
      });
      setIsRuleModalOpen(false);
      loadStructureDetails(selectedStructure.id);
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to create rule");
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this salary rule?")) return;
    try {
      await api.delete(`/payroll-config/rules/${id}`);
      if (selectedStructure) loadStructureDetails(selectedStructure.id);
    } catch (err) {
      console.error("Failed to delete rule:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-subtle">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-odoo-purple" />
            <span>Salary Structures & Dynamic Rules Configuration</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure dynamic earning/deduction calculation rules with sequential Python AST formula evaluation.
          </p>
        </div>

        {canEditRules ? (
          <button
            onClick={() => setIsRuleModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-black hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Salary Rule</span>
          </button>
        ) : (
          <span className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold rounded-lg">
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span>Read-Only Mode (Payroll Officer)</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Structures List */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Configured Structures</h2>
          {structures.map((s) => {
            const isSelected = selectedStructure && selectedStructure.id === s.id;
            return (
              <div
                key={s.id}
                onClick={() => loadStructureDetails(s.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? "bg-purple-50/60 border-odoo-purple text-odoo-purple shadow-sm"
                    : "bg-white border-slate-200 hover:border-slate-300 text-slate-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold">{s.name}</h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 font-mono text-slate-600">
                    {s.code}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{s.description || "Active payroll structure"}</p>
                <div className="mt-2 flex items-center justify-between text-[10px]">
                  <span className="font-semibold">{s.rules_count} Rules sequenced</span>
                  <span className="text-emerald-600 font-bold">&bull; Active</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Ordered Rules Execution Hierarchy */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Rule Execution Sequence for: <span className="text-odoo-purple">{selectedStructure?.name}</span>
              </h2>
              <p className="text-xs text-slate-400">
                Rules execute from lowest sequence (10) to highest (500), allowing downstream totals to build upon upstream calculations.
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-50 text-odoo-purple">
              Python AST Sandbox
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-subtle">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Seq #</th>
                  <th className="px-4 py-3">Rule Name & Code</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Computation Type</th>
                  <th className="px-4 py-3">Calculation Expression / Rate</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rules.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      No rules configured for this structure. Click "Add Salary Rule" to create one.
                    </td>
                  </tr>
                ) : (
                  rules.map((r) => {
                    const isGross = r.category === "GROSS";
                    const isNet = r.category === "NET";
                    const isDed = r.category === "DEDUCTION";
                    return (
                      <tr
                        key={r.id}
                        className={`hover:bg-slate-50 transition-colors ${
                          isNet ? "bg-emerald-50/20 font-semibold" : isGross ? "bg-blue-50/20" : ""
                        }`}
                      >
                        <td className="px-4 py-3 font-mono font-bold text-slate-800">{r.sequence}</td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900">{r.name}</p>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1 py-0.2 rounded">
                            {r.code}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              r.category === "BASIC"
                                ? "bg-purple-100 text-odoo-purple"
                                : r.category === "ALLOWANCE"
                                ? "bg-blue-100 text-blue-800"
                                : r.category === "GROSS"
                                ? "bg-indigo-100 text-indigo-800"
                                : isDed
                                ? "bg-rose-100 text-rose-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {r.category}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-700">{r.computation_type}</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-700 max-w-xs">
                          {r.computation_type === "FIXED" && <span>Fixed: ₹{r.fixed_amount?.toLocaleString()}</span>}
                          {r.computation_type === "PERCENTAGE" && (
                            <span>{r.percentage}% of {r.percentage_base_code || "Wage"}</span>
                          )}
                          {r.computation_type === "FORMULA" && (
                            <span className="text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 truncate block">
                              {r.formula_expression}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {canEditRules && (
                            <button
                              onClick={() => handleDeleteRule(r.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                              title="Delete rule"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CREATE RULE MODAL */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-floating border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Add Salary Rule</h2>
              <button onClick={() => setIsRuleModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Rule Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Special Performance Allowance"
                    value={ruleForm.name}
                    onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Rule Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="SPA"
                    value={ruleForm.code}
                    onChange={(e) => setRuleForm({ ...ruleForm, code: e.target.value.toUpperCase() })}
                    className="w-full p-2 border rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Category *</label>
                  <select
                    value={ruleForm.category}
                    onChange={(e) => setRuleForm({ ...ruleForm, category: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="BASIC">BASIC</option>
                    <option value="ALLOWANCE">ALLOWANCE</option>
                    <option value="GROSS">GROSS</option>
                    <option value="DEDUCTION">DEDUCTION</option>
                    <option value="NET">NET</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Sequence # (Ordering) *</label>
                  <input
                    type="number"
                    required
                    value={ruleForm.sequence}
                    onChange={(e) => setRuleForm({ ...ruleForm, sequence: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Computation Method *</label>
                <div className="grid grid-cols-3 gap-2">
                  {["FIXED", "PERCENTAGE", "FORMULA"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setRuleForm({ ...ruleForm, computation_type: type })}
                      className={`p-2 rounded-lg border text-center font-bold ${
                        ruleForm.computation_type === type
                          ? "bg-odoo-purple text-white border-odoo-purple shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-700"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Inputs based on Computation Type */}
              {ruleForm.computation_type === "FIXED" && (
                <div>
                  <label className="block font-semibold mb-1">Fixed Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={ruleForm.fixed_amount}
                    onChange={(e) => setRuleForm({ ...ruleForm, fixed_amount: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg font-bold"
                  />
                </div>
              )}

              {ruleForm.computation_type === "PERCENTAGE" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Percentage (%) *</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={ruleForm.percentage}
                      onChange={(e) => setRuleForm({ ...ruleForm, percentage: Number(e.target.value) })}
                      className="w-full p-2 border rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Applied on Base Code *</label>
                    <input
                      type="text"
                      placeholder="BASIC or WAGE"
                      value={ruleForm.percentage_base_code}
                      onChange={(e) => setRuleForm({ ...ruleForm, percentage_base_code: e.target.value.toUpperCase() })}
                      className="w-full p-2 border rounded-lg font-mono font-bold"
                    />
                  </div>
                </div>
              )}

              {ruleForm.computation_type === "FORMULA" && (
                <div>
                  <label className="block font-semibold mb-1">
                    Python AST Expression *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. rules['GROSS'] - rules['PF'] or contract.wage * 0.40"
                    value={ruleForm.formula_expression}
                    onChange={(e) => setRuleForm({ ...ruleForm, formula_expression: e.target.value })}
                    className="w-full p-2 border rounded-lg font-mono text-purple-700"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Available runtime variables: <code className="text-slate-700">contract.wage</code>, <code className="text-slate-700">worked_days</code>, <code className="text-slate-700">unpaid_days</code>, <code className="text-slate-700">rules[&apos;CODE&apos;]</code>
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsRuleModalOpen(false)}
                  className="px-3 py-2 border rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-slate-800 shadow-sm transition-all"
                >
                  Save Salary Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
