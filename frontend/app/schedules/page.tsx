"use client";

import React, { useState, useEffect } from "react";
import { Clock, Plus, X, CheckCircle2, Calendar } from "lucide-react";
import api from "@/lib/api";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Schedule 7-day pattern builder
  const [name, setName] = useState("Shift Schedule 35h");
  const [scheduleType, setScheduleType] = useState("SHIFT_BASED");
  const [patterns, setPatterns] = useState<any[]>(
    DAYS.map((d) => ({
      day_of_week: d,
      is_active: d !== "SATURDAY" && d !== "SUNDAY",
      start_time: "09:00",
      end_time: "17:00",
      break_duration_mins: 60,
      day_hours: d !== "SATURDAY" && d !== "SUNDAY" ? 7.0 : 0.0,
    }))
  );

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await api.get("/schedules");
      setSchedules(res.data);
    } catch (err) {
      console.error("Failed to load schedules:", err);
    } finally {
      setLoading(false);
    }
  };

  // Live Auto-Calculation of Daily and Weekly Hours
  const updatePattern = (idx: number, field: string, val: any) => {
    const updated = [...patterns];
    updated[idx][field] = val;

    if (updated[idx].is_active) {
      const [sh, sm] = updated[idx].start_time.split(":").map(Number);
      const [eh, em] = updated[idx].end_time.split(":").map(Number);
      const durationMins = (eh * 60 + em) - (sh * 60 + sm) - Number(updated[idx].break_duration_mins);
      updated[idx].day_hours = Math.max(0, Math.round((durationMins / 60) * 100) / 100);
    } else {
      updated[idx].day_hours = 0;
    }
    setPatterns(updated);
  };

  const totalWeeklyHours = patterns.reduce((acc, p) => acc + (p.day_hours || 0), 0);

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/schedules", {
        name,
        schedule_type: scheduleType,
        patterns,
      });
      setIsModalOpen(false);
      fetchSchedules();
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to create schedule");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-subtle">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-odoo-purple" />
            <span>Working Schedules Configuration</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Define daily shift patterns. Weekly hours are computed automatically from time intervals minus breaks.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-odoo-purple hover:bg-odoo-purpleHover text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Working Schedule</span>
        </button>
      </div>

      {/* Schedules List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {schedules.map((s) => (
          <div key={s.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">{s.name}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-odoo-purple">
                  {s.schedule_type}
                </span>
              </div>
              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Standard Weekly Hours:</span>
                <span className="text-lg font-black text-slate-900 font-mono">{s.weekly_hours} hrs/wk</span>
              </div>
              <div className="mt-3 space-y-1 text-[11px] text-slate-500">
                {s.patterns?.filter((p: any) => p.is_active).map((p: any) => (
                  <div key={p.day_of_week} className="flex justify-between py-0.5">
                    <span className="font-medium text-slate-700">{p.day_of_week}:</span>
                    <span className="font-mono">{p.start_time} - {p.end_time} ({p.day_hours}h)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE WORKING SCHEDULE MODAL (With Live Auto-Calculation) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-floating border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Define Working Schedule Pattern</h2>
                <p className="text-xs text-slate-400">Total weekly hours are calculated automatically without manual input.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="p-6 space-y-4 text-xs overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Schedule Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Schedule Type *</label>
                  <select
                    value={scheduleType}
                    onChange={(e) => setScheduleType(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="STANDARD_40H">STANDARD 40H</option>
                    <option value="SHIFT_BASED">SHIFT BASED</option>
                    <option value="FLEXIBLE">FLEXIBLE</option>
                    <option value="PART_TIME">PART TIME</option>
                  </select>
                </div>
              </div>

              {/* 7-Day Pattern Table */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2">7-Day Weekly Shift Schedule</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b text-[10px] uppercase font-bold text-slate-500">
                      <tr>
                        <th className="p-2.5">Active</th>
                        <th className="p-2.5">Day</th>
                        <th className="p-2.5">Start</th>
                        <th className="p-2.5">End</th>
                        <th className="p-2.5">Break (Mins)</th>
                        <th className="p-2.5 text-right">Day Hours</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {patterns.map((p, idx) => (
                        <tr key={p.day_of_week} className={p.is_active ? "bg-white" : "bg-slate-50 text-slate-400"}>
                          <td className="p-2.5">
                            <input
                              type="checkbox"
                              checked={p.is_active}
                              onChange={(e) => updatePattern(idx, "is_active", e.target.checked)}
                              className="rounded text-odoo-purple"
                            />
                          </td>
                          <td className="p-2.5 font-bold">{p.day_of_week}</td>
                          <td className="p-2.5">
                            <input
                              type="time"
                              disabled={!p.is_active}
                              value={p.start_time}
                              onChange={(e) => updatePattern(idx, "start_time", e.target.value)}
                              className="p-1 border rounded text-xs"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="time"
                              disabled={!p.is_active}
                              value={p.end_time}
                              onChange={(e) => updatePattern(idx, "end_time", e.target.value)}
                              className="p-1 border rounded text-xs"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="number"
                              disabled={!p.is_active}
                              value={p.break_duration_mins}
                              onChange={(e) => updatePattern(idx, "break_duration_mins", Number(e.target.value))}
                              className="w-16 p-1 border rounded text-xs"
                            />
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                            {p.day_hours.toFixed(1)} hrs
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Live Computed Weekly Hours Banner */}
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between font-bold text-odoo-purple">
                <span>Calculated Total Weekly Hours:</span>
                <span className="text-base font-black font-mono">{totalWeeklyHours.toFixed(1)} Hours / Week</span>
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
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
