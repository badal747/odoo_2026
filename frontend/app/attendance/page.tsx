"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Clock,
  Calendar,
  Edit2,
  X,
} from "lucide-react";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

function AttendanceContent() {
  const { user, hasRole } = useAuth();
  const canManageAttendance = hasRole(["ADMIN", "HR_MANAGER", "HR_PAYROLL_MANAGER"]);

  const searchParams = useSearchParams();
  const filterEmployeeId = searchParams.get("employee_id");

  // Default to today's local date YYYY-MM-DD
  const todayStr = new Date().toLocaleDateString("en-CA");
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toLocaleDateString("en-CA");

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Manual Correction Modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    check_in: "",
    check_out: "",
    status: "PRESENT",
    manual_edit_note: "",
  });

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterEmployeeId, selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterEmployeeId) params.employee_id = filterEmployeeId;
      if (selectedDate && selectedDate !== "ALL") params.date = selectedDate;

      const res = await api.get("/attendance", { params });
      setAttendances(res.data || []);
    } catch (err) {
      console.error("Failed to load attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (record: any) => {
    setSelectedRecord(record);
    setEditForm({
      check_in: record.check_in ? record.check_in.substring(0, 16) : "",
      check_out: record.check_out ? record.check_out.substring(0, 16) : "",
      status: record.status,
      manual_edit_note: record.manual_edit_note || "",
    });
    setIsEditOpen(true);
  };

  const handleSaveCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    try {
      await api.put(`/attendance/${selectedRecord.id}/manual-correction`, {
        check_in: new Date(editForm.check_in).toISOString(),
        check_out: editForm.check_out ? new Date(editForm.check_out).toISOString() : null,
        status: editForm.status,
        manual_edit_note: editForm.manual_edit_note,
        edited_by_user_id: user?.user_id || user?.email || "supervisor",
      });
      setIsEditOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to update attendance record");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-subtle">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-odoo-teal" />
            <span>Attendance & Schedule Operations</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Capture daily check-ins, compute worked hours, audit exceptions, and support authorized manual edits.
          </p>
        </div>

        {filterEmployeeId && (
          <a
            href="/attendance"
            className="text-xs px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium self-start sm:self-auto"
          >
            Clear Employee Filter
          </a>
        )}
      </div>

      {/* Interactive Calendar Date Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Calendar Picker */}
          <div className="flex items-center space-x-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-lg text-xs transition-colors">
            <Calendar className="w-4 h-4 text-slate-600" />
            <span className="font-semibold text-slate-700">Choose Date:</span>
            <input
              type="date"
              value={selectedDate === "ALL" ? "" : selectedDate}
              onChange={(e) => setSelectedDate(e.target.value || "ALL")}
              className="bg-transparent text-xs font-semibold text-slate-900 focus:outline-none cursor-pointer"
            />
          </div>

          {/* Quick Date Shortcuts */}
          <button
            onClick={() => setSelectedDate(todayStr)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedDate === todayStr
                ? "bg-black text-white shadow-sm"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            Today
          </button>

          <button
            onClick={() => setSelectedDate(yesterdayStr)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedDate === yesterdayStr
                ? "bg-black text-white shadow-sm"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            Yesterday
          </button>

          <button
            onClick={() => setSelectedDate("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedDate === "ALL"
                ? "bg-black text-white shadow-sm"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            All Dates Log
          </button>
        </div>

        {/* Selected Date Status & Count */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-600 font-medium">
            {selectedDate === "ALL" ? (
              <span>Showing all historical logs</span>
            ) : selectedDate === todayStr ? (
              <span className="text-emerald-700 font-semibold flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                <span>Today's Log ({formatDate(selectedDate)})</span>
              </span>
            ) : (
              <span>Selected Date: <strong className="text-slate-900">{formatDate(selectedDate)}</strong></span>
            )}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold text-[11px] border border-slate-200">
            {attendances.length} {attendances.length === 1 ? "record" : "records"}
          </span>
        </div>
      </div>

      {/* Attendance Log Table (100% Responsive with horizontal scroll wrapper) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-subtle">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Check In</th>
                <th className="px-4 py-3">Check Out</th>
                <th className="px-4 py-3">Worked Hours</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Audit & Correction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <Clock className="w-7 h-7 text-slate-300 mx-auto mb-2 animate-spin" />
                    <p className="text-xs font-semibold text-slate-600">Loading attendance logs...</p>
                  </td>
                </tr>
              ) : attendances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700 text-sm">
                      No attendance records for {selectedDate === "ALL" ? "any date" : formatDate(selectedDate)}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {selectedDate === todayStr
                        ? "Use the 'Check In' button in the navigation bar to mark attendance for today."
                        : "Select another date from the calendar or choose 'All Dates Log' above."}
                    </p>
                  </td>
                </tr>
              ) : (
              attendances.map((a) => {
                const isLate = a.status === "LATE";
                const isHalfDay = a.status === "HALF_DAY";
                return (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-800">{formatDate(a.date)}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{a.employee_name}</td>
                    <td className="px-4 py-3 text-slate-700 font-mono">
                      {a.check_in ? new Date(a.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-mono">
                      {a.check_out ? new Date(a.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : <span className="text-amber-500 font-bold">Missing</span>}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">{a.worked_hours.toFixed(2)} hrs</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          a.status === "PRESENT"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : isLate
                            ? "bg-amber-50 text-amber-800 border border-amber-300"
                            : isHalfDay
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {a.status}
                      </span>
                      {a.is_manual_edit && (
                        <span className="ml-1 text-[9px] px-1 bg-amber-100 text-amber-800 rounded font-semibold" title={`Note: ${a.manual_edit_note}`}>
                          Edited
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canManageAttendance ? (
                        <button
                          onClick={() => handleOpenEdit(a)}
                          className="inline-flex items-center space-x-1 text-odoo-purple hover:underline font-semibold"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Correct</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">&mdash;</span>
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

      {/* Manual Attendance Correction Modal */}
      {isEditOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-floating border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Manual Attendance Correction</h2>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCorrection} className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-700">
                <p><b>Employee:</b> {selectedRecord.employee_name}</p>
                <p><b>Date:</b> {formatDate(selectedRecord.date)}</p>
              </div>

              <div>
                <label className="block font-semibold mb-1">Check In Time</label>
                <input
                  type="datetime-local"
                  required
                  value={editForm.check_in}
                  onChange={(e) => setEditForm({ ...editForm, check_in: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Check Out Time</label>
                <input
                  type="datetime-local"
                  value={editForm.check_out}
                  onChange={(e) => setEditForm({ ...editForm, check_out: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Attendance Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full p-2 border rounded-lg font-medium"
                >
                  <option value="PRESENT">PRESENT</option>
                  <option value="LATE">LATE</option>
                  <option value="HALF_DAY">HALF_DAY</option>
                  <option value="OVERTIME">OVERTIME</option>
                  <option value="ABSENT">ABSENT</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Mandatory Audit Trail Note * <span className="text-slate-400 font-normal">(Reason for manual change)</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Employee forgot biometric punch due to client site visit"
                  value={editForm.manual_edit_note}
                  onChange={(e) => setEditForm({ ...editForm, manual_edit_note: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-3 py-2 border rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-slate-800 shadow-sm transition-all"
                >
                  Save Correction &amp; Audit Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AttendancePage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-slate-400">Loading attendance logs...</div>}>
      <AttendanceContent />
    </Suspense>
  );
}
