"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Filter,
  UserCheck,
  AlertCircle,
  X,
  PieChart
} from "lucide-react";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

function TimeOffContent() {
  const { user, hasRole } = useAuth();
  const canManageLeaves = hasRole(["ADMIN", "HR_MANAGER", "HR_PAYROLL_MANAGER"]);

  const searchParams = useSearchParams();
  const filterEmployeeId = searchParams.get("employee_id");

  const [activeTab, setActiveTab] = useState<"requests" | "allocations" | "types">("requests");
  const [requests, setRequests] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Request Modal
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [reqForm, setReqForm] = useState({
    employee_id: filterEmployeeId || "",
    time_off_type_id: "",
    start_date: "2026-03-10",
    end_date: "2026-03-12",
    duration_units: 3.0,
    reason: "",
  });
  const [reqError, setReqError] = useState("");

  // New Allocation Modal
  const [isAllocModalOpen, setIsAllocModalOpen] = useState(false);
  const [allocForm, setAllocForm] = useState({
    employee_id: filterEmployeeId || "",
    time_off_type_id: "",
    allocated_units: 15.0,
    valid_from: "2026-01-01",
    valid_to: "2026-12-31",
  });

  useEffect(() => {
    fetchData();
  }, [filterEmployeeId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqRes, allocRes, typesRes, empRes] = await Promise.all([
        api.get("/time-off/requests", { params: { employee_id: filterEmployeeId || undefined } }),
        api.get("/time-off/allocations", { params: { employee_id: filterEmployeeId || undefined } }),
        api.get("/time-off/types"),
        api.get("/employees"),
      ]);
      setRequests(reqRes.data);
      setAllocations(allocRes.data);
      setTypes(typesRes.data);
      setEmployees(empRes.data);

      if (typesRes.data.length > 0) {
        setReqForm((prev) => ({ ...prev, time_off_type_id: typesRes.data[0].id }));
        setAllocForm((prev) => ({ ...prev, time_off_type_id: typesRes.data[0].id }));
      }
      if (empRes.data.length > 0 && !filterEmployeeId) {
        setReqForm((prev) => ({ ...prev, employee_id: empRes.data[0].id }));
        setAllocForm((prev) => ({ ...prev, employee_id: empRes.data[0].id }));
      }
    } catch (err) {
      console.error("Failed to load time-off data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (id: string) => {
    try {
      await api.put(`/time-off/requests/${id}/approve`);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Approval failed");
    }
  };

  const handleRefuseRequest = async (id: string) => {
    const reason = prompt("Enter refusal reason:") || "Not approved by manager";
    try {
      await api.put(`/time-off/requests/${id}/refuse`, { refusal_reason: reason });
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Refusal failed");
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqError("");
    try {
      await api.post("/time-off/requests", {
        ...reqForm,
        start_date: new Date(reqForm.start_date).toISOString(),
        end_date: new Date(reqForm.end_date).toISOString(),
        duration_units: Number(reqForm.duration_units),
      });
      setIsRequestModalOpen(false);
      fetchData();
    } catch (err: any) {
      setReqError(err?.response?.data?.detail || "Failed to submit request");
    }
  };

  const handleCreateAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/time-off/allocations", {
        ...allocForm,
        valid_from: new Date(allocForm.valid_from).toISOString(),
        valid_to: new Date(allocForm.valid_to).toISOString(),
        allocated_units: Number(allocForm.allocated_units),
      });
      setIsAllocModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to create allocation");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-subtle">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span>Time Off & Leave Balances</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage leave requests, atomic balance deductions, approved quotas, and paid/unpaid policies.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {filterEmployeeId && (
            <a
              href="/time-off"
              className="text-xs px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
            >
              Clear Filter
            </a>
          )}
          {activeTab === "requests" && (
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-black hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Submit Leave Request</span>
            </button>
          )}
          {activeTab === "allocations" && canManageLeaves && (
            <button
              onClick={() => setIsAllocModalOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-black hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Allocate Balance</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("requests")}
          className={`pb-3 px-1 border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === "requests" ? "border-blue-600 text-blue-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Leave Requests ({requests.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("allocations")}
          className={`pb-3 px-1 border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === "allocations" ? "border-odoo-purple text-odoo-purple font-bold" : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>Employee Allocations & Balances ({allocations.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("types")}
          className={`pb-3 px-1 border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === "types" ? "border-emerald-600 text-emerald-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Configured Time Off Types ({types.length})</span>
        </button>
      </div>

      {/* TAB 1: REQUESTS */}
      {activeTab === "requests" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-subtle">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Leave Type</th>
                <th className="px-4 py-3">Date Interval</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Approval Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No time off requests found.
                  </td>
                </tr>
              ) : (
                requests.map((r) => {
                  const isPending = r.status === "PENDING";
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">{r.employee_name}</td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm"
                          style={{ backgroundColor: r.color_code || "#3B82F6" }}
                        >
                          {r.time_off_type_name}
                        </span>
                        {!r.is_paid && (
                          <span className="ml-1.5 text-[9px] px-1 py-0.2 bg-rose-100 text-rose-700 rounded font-semibold">
                            Unpaid Deduction
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatDate(r.start_date)} &rarr; {formatDate(r.end_date)}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">{r.duration_units} Days</td>
                      <td className="px-4 py-3 text-slate-500 italic max-w-xs truncate">{r.reason || "No reason specified"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : r.status === "REFUSED"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800 animate-pulse"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isPending ? (
                          canManageLeaves ? (
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleApproveRequest(r.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-[11px] shadow-sm flex items-center space-x-1"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Approve (Deduct)</span>
                              </button>
                              <button
                                onClick={() => handleRefuseRequest(r.id)}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded font-semibold text-[11px]"
                              >
                                Refuse
                              </button>
                            </div>
                          ) : (
                            <span className="text-amber-600 text-[11px] font-medium italic">Pending HR Approval</span>
                          )
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Processed</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: ALLOCATIONS */}
      {activeTab === "allocations" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-subtle">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Leave Type</th>
                <th className="px-4 py-3">Allocated Quota</th>
                <th className="px-4 py-3">Taken / Deducted</th>
                <th className="px-4 py-3">Remaining Balance</th>
                <th className="px-4 py-3">Validity Period</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allocations.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900">{a.employee_name}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{a.time_off_type_name}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">{a.allocated_units} Days</td>
                  <td className="px-4 py-3 text-rose-600 font-semibold">{a.taken_units} Days</td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-md font-bold text-xs">
                      {a.remaining_units} Days
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatDate(a.valid_from)} &rarr; {formatDate(a.valid_to)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: TYPES */}
      {activeTab === "types" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {types.map((t) => (
            <div key={t.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: t.color_code }} />
                  <h3 className="font-bold text-slate-900 text-sm">{t.name}</h3>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Code: <b>{t.code}</b> &bull; Unit: {t.unit}</p>
                <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                  <p className="flex items-center justify-between">
                    <span>Requires Quota Allocation:</span>
                    <span className="font-semibold">{t.requires_allocation ? "Yes (Strict Check)" : "No (Unlimited)"}</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span>Payroll Policy:</span>
                    <span className={`font-bold ${t.is_paid ? "text-emerald-600" : "text-rose-600"}`}>
                      {t.is_paid ? "Paid Time Off" : "Unpaid (Salary Deduction)"}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* NEW TIME OFF REQUEST MODAL */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-floating border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Submit Time Off Request</h2>
              <button onClick={() => setIsRequestModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {reqError && (
              <div className="m-6 mb-0 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{reqError}</span>
              </div>
            )}

            <form onSubmit={handleCreateRequest} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Employee *</label>
                <select
                  required
                  value={reqForm.employee_id}
                  onChange={(e) => setReqForm({ ...reqForm, employee_id: e.target.value })}
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

              <div>
                <label className="block font-semibold mb-1">Leave Type *</label>
                <select
                  required
                  value={reqForm.time_off_type_id}
                  onChange={(e) => setReqForm({ ...reqForm, time_off_type_id: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                >
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={reqForm.start_date}
                    onChange={(e) => setReqForm({ ...reqForm, start_date: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={reqForm.end_date}
                    onChange={(e) => setReqForm({ ...reqForm, end_date: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Duration (Days) *</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={reqForm.duration_units}
                  onChange={(e) => setReqForm({ ...reqForm, duration_units: Number(e.target.value) })}
                  className="w-full p-2 border rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Reason (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Attending family wedding"
                  value={reqForm.reason}
                  onChange={(e) => setReqForm({ ...reqForm, reason: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-3 py-2 border rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-slate-800 shadow-sm transition-all"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW ALLOCATION MODAL */}
      {isAllocModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-floating border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Allocate Leave Quota Balance</h2>
              <button onClick={() => setIsAllocModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAllocation} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Employee *</label>
                <select
                  required
                  value={allocForm.employee_id}
                  onChange={(e) => setAllocForm({ ...allocForm, employee_id: e.target.value })}
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

              <div>
                <label className="block font-semibold mb-1">Leave Type *</label>
                <select
                  required
                  value={allocForm.time_off_type_id}
                  onChange={(e) => setAllocForm({ ...allocForm, time_off_type_id: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                >
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Allocated Days *</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={allocForm.allocated_units}
                  onChange={(e) => setAllocForm({ ...allocForm, allocated_units: Number(e.target.value) })}
                  className="w-full p-2 border rounded-lg font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Valid From *</label>
                  <input
                    type="date"
                    required
                    value={allocForm.valid_from}
                    onChange={(e) => setAllocForm({ ...allocForm, valid_from: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Valid To *</label>
                  <input
                    type="date"
                    required
                    value={allocForm.valid_to}
                    onChange={(e) => setAllocForm({ ...allocForm, valid_to: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAllocModalOpen(false)}
                  className="px-3 py-2 border rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-slate-800 shadow-sm transition-all"
                >
                  Approve & Assign Quota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TimeOffPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-slate-400">Loading leave data...</div>}>
      <TimeOffContent />
    </Suspense>
  );
}
