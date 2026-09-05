"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  DollarSign,
  Building,
  Briefcase,
  X,
  UserCheck
} from "lucide-react";
import api from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

function ContractsContent() {
  const searchParams = useSearchParams();
  const filterEmployeeId = searchParams.get("employee_id");

  const [contracts, setContracts] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [formData, setFormData] = useState({
    contract_code: "",
    employee_id: filterEmployeeId || "",
    department_id: "",
    job_position_id: "",
    start_date: "2026-01-01",
    end_date: "",
    status: "RUNNING",
    wage: 65000,
    salary_structure_id: "",
  });

  useEffect(() => {
    fetchData();
  }, [filterEmployeeId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [conRes, empRes, structRes, deptRes, posRes] = await Promise.all([
        api.get("/contracts", { params: { employee_id: filterEmployeeId || undefined } }),
        api.get("/employees"),
        api.get("/payroll-config/structures"),
        api.get("/employees/departments/all"),
        api.get("/employees/positions/all"),
      ]);
      setContracts(conRes.data);
      setEmployees(empRes.data);
      setStructures(structRes.data);
      setDepartments(deptRes.data);
      setPositions(posRes.data);

      if (structRes.data.length > 0) {
        setFormData((prev) => ({ ...prev, salary_structure_id: structRes.data[0].id }));
      }
      if (empRes.data.length > 0 && !filterEmployeeId) {
        const first = empRes.data[0];
        setFormData((prev) => ({
          ...prev,
          employee_id: first.id,
          department_id: first.department_id,
          job_position_id: first.job_position_id,
        }));
      }
    } catch (err) {
      console.error("Failed to load contracts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      await api.post("/contracts", {
        ...formData,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
        wage: Number(formData.wage),
      });
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || "Failed to create contract");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-subtle">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-odoo-purple" />
            <span>Contract Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Maintain historical and active employment terms. Payroll binds exclusively to period-valid contracts.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {filterEmployeeId && (
            <a
              href="/contracts"
              className="text-xs px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
            >
              Clear Filter
            </a>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-odoo-purple hover:bg-odoo-purpleHover text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Contract</span>
          </button>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-subtle">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Contract Code</th>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Monthly Wage</th>
              <th className="px-4 py-3">Salary Structure</th>
              <th className="px-4 py-3">Duration Period</th>
              <th className="px-4 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {contracts.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-400">
                  No contracts found for current filter.
                </td>
              </tr>
            ) : (
              contracts.map((c) => {
                const isRunning = c.status === "RUNNING";
                return (
                  <tr
                    key={c.id}
                    className={`hover:bg-purple-50/30 transition-colors ${
                      isRunning ? "bg-emerald-50/20" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-bold text-slate-900 flex items-center space-x-2">
                      <span>{c.contract_code}</span>
                      {isRunning && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active Payroll Binding" />
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{c.employee_name}</td>
                    <td className="px-4 py-3">{c.department_name}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{formatCurrency(c.wage)}</td>
                    <td className="px-4 py-3 text-slate-600">{c.salary_structure_name}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {formatDate(c.start_date)} &rarr; {c.end_date ? formatDate(c.end_date) : "Permanent"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isRunning
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : c.status === "EXPIRED"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* New Contract Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-floating border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Create Employment Contract</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="m-6 mb-0 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateContract} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Contract Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="CON-2026-006"
                    value={formData.contract_code}
                    onChange={(e) => setFormData({ ...formData, contract_code: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Employee *</label>
                  <select
                    required
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="">Select Employee</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.first_name} {e.last_name} ({e.employee_code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Monthly Base Wage (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.wage}
                    onChange={(e) => setFormData({ ...formData, wage: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Salary Structure *</label>
                  <select
                    required
                    value={formData.salary_structure_id}
                    onChange={(e) => setFormData({ ...formData, salary_structure_id: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  >
                    {structures.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">End Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Department *</label>
                  <select
                    required
                    value={formData.department_id}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="">Select Dept</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Position *</label>
                  <select
                    required
                    value={formData.job_position_id}
                    onChange={(e) => setFormData({ ...formData, job_position_id: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="">Select Position</option>
                    {positions.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 border rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-odoo-purple text-white rounded-lg font-semibold hover:bg-odoo-purpleHover"
                >
                  Create & Validate Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ContractsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-slate-400">Loading contracts...</div>}>
      <ContractsContent />
    </Suspense>
  );
}
