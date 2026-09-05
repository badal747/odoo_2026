"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Users,
  CreditCard,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Building2,
  DollarSign,
  Filter,
  RotateCcw,
  Clock,
  Timer,
  AlertCircle,
  Edit3,
  Sliders,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({
    total_net_paid: 0,
    total_payslips_generated: 0,
    average_salary: 0,
    approved_time_off_days: 0,
    attendance_health_percentage: 100.0,
    active_employees_count: 0,
  });
  const [deptCosts, setDeptCosts] = useState<any[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [attendanceOverview, setAttendanceOverview] = useState<any>({
    total_records: 0,
    present_count: 0,
    late_count: 0,
    half_day_count: 0,
    overtime_count: 0,
    missing_checkout_count: 0,
    manual_edits_count: 0,
    on_time_rate: 100.0,
  });

  // Multi-dimensional Filter Bar State (Section A7 in Hackathon PDF)
  const [selectedPeriod, setSelectedPeriod] = useState("ALL");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");

  const [loading, setLoading] = useState(true);

  const [lastSyncedTime, setLastSyncedTime] = useState<string>("");
  const [liveClock, setLiveClock] = useState<string>("");

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    const clockInterval = setInterval(() => {
      setLiveClock(new Date().toLocaleTimeString());
    }, 1000);
    setLiveClock(new Date().toLocaleTimeString());
    return () => clearInterval(clockInterval);
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const pollInterval = setInterval(() => {
      fetchDashboardData(true);
    }, 12000);
    return () => clearInterval(pollInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod, selectedDept, selectedType]);

  const fetchDepartments = async () => {
    try {
      const res = await api.get("/departments");
      setDepartments(res.data || []);
    } catch (err) {
      console.error("Failed to load departments:", err);
    }
  };

  const fetchDashboardData = async (silent: boolean = false) => {
    try {
      if (!silent) setLoading(true);
      const params = new URLSearchParams();
      if (selectedPeriod !== "ALL") params.append("period", selectedPeriod);
      if (selectedDept !== "ALL") params.append("department_id", selectedDept);
      if (selectedType !== "ALL") params.append("employment_type", selectedType);

      const deptCostsParams = new URLSearchParams();
      if (selectedType !== "ALL") deptCostsParams.append("employment_type", selectedType);

      const attParams = new URLSearchParams();
      if (selectedDept !== "ALL") attParams.append("department_id", selectedDept);

      const [statsRes, deptRes, trendsRes, alertsRes, attRes] = await Promise.allSettled([
        api.get(`/dashboard/stats?${params.toString()}`),
        api.get(`/dashboard/department-costs?${deptCostsParams.toString()}`),
        api.get("/dashboard/monthly-trends"),
        api.get("/dashboard/alerts"),
        api.get(`/dashboard/attendance-overview?${attParams.toString()}`),
      ]);

      if (statsRes.status === "fulfilled") setStats(statsRes.value.data || {});
      if (deptRes.status === "fulfilled") setDeptCosts(deptRes.value.data || []);
      if (trendsRes.status === "fulfilled") setMonthlyTrends(trendsRes.value.data || []);
      if (alertsRes.status === "fulfilled") setAlerts(alertsRes.value.data || []);
      if (attRes.status === "fulfilled") setAttendanceOverview(attRes.value.data || {});

      setLastSyncedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const userRole = user?.role || "EMPLOYEE";
  const canAccessPayroll = ["ADMIN", "HR_PAYROLL_MANAGER", "HR_PAYROLL_USER"].includes(userRole);
  const canAccessEmployees = ["ADMIN", "HR_MANAGER", "HR_PAYROLL_MANAGER", "HR_PAYROLL_USER"].includes(userRole);
  const canAccessContracts = ["ADMIN", "HR_MANAGER", "HR_PAYROLL_MANAGER", "HR_PAYROLL_USER"].includes(userRole);
  const canAccessConfig = ["ADMIN", "HR_PAYROLL_MANAGER", "HR_PAYROLL_USER"].includes(userRole);

  const handleResetFilters = () => {
    setSelectedPeriod("ALL");
    setSelectedDept("ALL");
    setSelectedType("ALL");
  };

  const hasActiveFilters = selectedPeriod !== "ALL" || selectedDept !== "ALL" || selectedType !== "ALL";

  return (
    <div className="space-y-6">
      {/* 1. Header with Real-Time Operations Pulse (Zero GPU Lag, 100% Real-Time Data) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-1 flex flex-col justify-between space-y-3 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Real-Time Operations</span>
                {loading && <span className="text-[10px] text-slate-400 font-normal">(Syncing...)</span>}
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              Real-time synchronization across Employees, Contracts, Attendance logs, Time Off allocations, and Payroll disbursements.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center space-x-1.5 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-700">{liveClock || "Live Clock"}</span>
              {lastSyncedTime && (
                <span className="text-[10px] text-slate-400 font-sans ml-1.5 hidden sm:inline">
                  (Synced: {lastSyncedTime})
                </span>
              )}
            </div>
            <button
              onClick={() => fetchDashboardData(false)}
              disabled={loading}
              className="inline-flex items-center space-x-1 text-[11px] font-semibold text-slate-700 hover:text-black hover:underline"
              title="Force Refresh Data"
            >
              <RotateCcw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
              <span>Sync Now</span>
            </button>
          </div>
        </div>

        {/* Real-Time Live Pulse Grid (Replaced heavy WebGL 3D Canvas with ultra-fast real-time cards) */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Live Staff</span>
              <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900">{stats?.active_employees_count ?? 0}</div>
              <p className="text-[10px] text-slate-500 mt-0.5">Active in database</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Punctuality</span>
              <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900">{attendanceOverview?.on_time_rate ?? 100}%</div>
              <p className="text-[10px] text-emerald-600 font-medium mt-0.5">{attendanceOverview?.present_count ?? 0} present today</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Payslips Run</span>
              <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center">
                <CreditCard className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900">{stats?.total_payslips_generated ?? 0}</div>
              <p className="text-[10px] text-slate-500 mt-0.5">Generated &amp; verified</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Attention</span>
              <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900">{alerts?.length ?? 0}</div>
              <p className="text-[10px] text-amber-600 font-medium mt-0.5">Pending audit items</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. EXECUTIVE QUICK ACTION RIBBON (Solid Black Action Buttons) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-black" />
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Quick Actions</span>
          <span className="text-[11px] text-slate-400 hidden md:inline">&bull; Role-tailored workspace shortcuts</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canAccessPayroll && (
            <Link
              href="/payroll"
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-black hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Process Payrun</span>
            </Link>
          )}
          {canAccessEmployees && (
            <Link
              href="/employees"
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-black hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Staff Directory</span>
            </Link>
          )}
          {canAccessContracts && (
            <Link
              href="/contracts"
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-black hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Contracts Hub</span>
            </Link>
          )}
          <Link
            href="/attendance"
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-black hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Attendance Hub</span>
          </Link>
          <Link
            href="/time-off"
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Time Off Portal</span>
          </Link>
          {canAccessConfig && (
            <Link
              href="/config"
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Salary Rules</span>
            </Link>
          )}
        </div>
      </div>

      {/* 3. MULTI-DIMENSIONAL FILTER BAR (Section A7 in Hackathon PDF) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
          <Filter className="w-4 h-4 text-slate-900" />
          <span>Multi-Dimensional Filters:</span>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-bold border border-slate-200">
              Active Filters Applied
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Dynamic Real-Time Period Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium text-[11px]">Period:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Periods (YTD)</option>
              {(stats?.available_periods || []).map((p: string) => {
                const parts = p.split("-");
                const y = parseInt(parts[0]);
                const m = parseInt(parts[1]);
                const monthName = new Date(y, m - 1, 1).toLocaleString("default", { month: "long" });
                return (
                  <option key={p} value={p}>
                    {monthName} {y}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Department Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium text-[11px]">Department:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          {/* Employment Type Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium text-[11px]">Type:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Employment Types</option>
              <option value="FULL_TIME">Full Time</option>
              <option value="PART_TIME">Part Time</option>
              <option value="INTERN">Intern</option>
              <option value="CONTRACT">Contract</option>
            </select>
          </div>

          {/* Reset Filters (Solid Black Button) */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="flex items-center space-x-1 px-3 py-1.5 bg-black hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Operational Alerts Panel (Pre-validation Warnings) */}
      {alerts && alerts.length > 0 && (
        <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Operational Attention Items</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {alerts.map((alt, idx) => (
              <div key={idx} className="flex items-center space-x-2 text-xs text-slate-700 bg-amber-50/50 px-3 py-2 rounded-lg border border-amber-200/70">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span className="font-medium truncate">{alt.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. KPI Stat Cards (White Theme with Solid Black/Dark Accents) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Net Paid */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Net Salary Paid</p>
            <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center shadow-sm">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-2">{formatCurrency(stats?.total_net_paid ?? 0)}</h2>
          <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" />
            <span>{selectedPeriod === "ALL" ? "All historical disbursements" : `${selectedPeriod} disbursements`}</span>
          </p>
        </div>

        {/* Payslips Generated */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Payslips Processed</p>
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-sm">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-2">{stats?.total_payslips_generated ?? 0}</h2>
          <p className="text-[11px] text-slate-500 font-medium mt-1 flex items-center">
            <span>Across {stats?.active_employees_count ?? 0} active staff</span>
          </p>
        </div>

        {/* Average Monthly Salary */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Base Salary</p>
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center shadow-sm">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-2">{formatCurrency(stats?.average_salary ?? 0)}</h2>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Filtered active contracts</p>
        </div>

        {/* Attendance Health Score */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance Health</p>
            <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-300 flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-2">{stats?.attendance_health_percentage ?? 100}%</h2>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">On-time check-in ratio</p>
        </div>
      </div>

      {/* 6. DETAILED ATTENDANCE BREAKDOWN WIDGET (Section B9 in Hackathon PDF) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-slate-900" />
              <h3 className="text-sm font-bold text-slate-900">Attendance Compliance &amp; Shift Exception Breakdown</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Granular breakdown of logs, punctuality infractions, overtime, missing check-outs, and manual edits (PDF Section B9).
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500">Punctuality Compliance:</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              {attendanceOverview?.on_time_rate ?? 100}% On-Time
            </span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2.5 mb-4 overflow-hidden flex">
          <div
            className="bg-emerald-500 h-full transition-all duration-500"
            style={{ width: `${Math.min(attendanceOverview?.on_time_rate ?? 100, 100)}%` }}
            title={`Present: ${attendanceOverview?.present_count ?? 0}`}
          />
          <div
            className="bg-amber-400 h-full transition-all duration-500"
            style={{
              width: `${
                (attendanceOverview?.total_records ?? 0) > 0
                  ? ((attendanceOverview?.late_count ?? 0) / attendanceOverview.total_records) * 100
                  : 0
              }%`,
            }}
            title={`Late: ${attendanceOverview?.late_count ?? 0}`}
          />
          <div
            className="bg-rose-500 h-full transition-all duration-500"
            style={{
              width: `${
                (attendanceOverview?.total_records ?? 0) > 0
                  ? ((attendanceOverview?.missing_checkout_count ?? 0) / attendanceOverview.total_records) * 100
                  : 0
              }%`,
            }}
            title={`Missing Checkouts: ${attendanceOverview?.missing_checkout_count ?? 0}`}
          />
        </div>

        {/* 6 Exception Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Present */}
          <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center space-x-1 text-emerald-800 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Present</span>
            </div>
            <p className="text-lg font-bold text-emerald-900 mt-1">{attendanceOverview?.present_count ?? 0}</p>
            <p className="text-[10px] text-emerald-700">Full shift completed</p>
          </div>

          {/* Late */}
          <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center space-x-1 text-amber-800 text-xs font-bold">
              <Timer className="w-3.5 h-3.5 text-amber-600" />
              <span>Late Arrivals</span>
            </div>
            <p className="text-lg font-bold text-amber-900 mt-1">{attendanceOverview?.late_count ?? 0}</p>
            <p className="text-[10px] text-amber-700">Grace period exceeded</p>
          </div>

          {/* Half Day */}
          <div className="bg-sky-50/50 border border-sky-200 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center space-x-1 text-sky-800 text-xs font-bold">
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              <span>Half Day</span>
            </div>
            <p className="text-lg font-bold text-sky-900 mt-1">{attendanceOverview?.half_day_count ?? 0}</p>
            <p className="text-[10px] text-sky-700">&lt; 5.0 hours worked</p>
          </div>

          {/* Overtime */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center space-x-1 text-slate-900 text-xs font-bold">
              <TrendingUp className="w-3.5 h-3.5 text-slate-700" />
              <span>Overtime</span>
            </div>
            <p className="text-lg font-bold text-slate-900 mt-1">{attendanceOverview?.overtime_count ?? 0}</p>
            <p className="text-[10px] text-slate-500">Extra hours logged</p>
          </div>

          {/* Missing Checkouts */}
          <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center space-x-1 text-rose-800 text-xs font-bold">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Missing Check-out</span>
            </div>
            <p className="text-lg font-bold text-rose-900 mt-1">{attendanceOverview?.missing_checkout_count ?? 0}</p>
            <p className="text-[10px] text-rose-700">Open sessions flagged</p>
          </div>

          {/* Manual Edits */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center space-x-1 text-slate-800 text-xs font-bold">
              <Edit3 className="w-3.5 h-3.5 text-slate-600" />
              <span>Manual Edits</span>
            </div>
            <p className="text-lg font-bold text-slate-900 mt-1">{attendanceOverview?.manual_edits_count ?? 0}</p>
            <p className="text-[10px] text-slate-500">Supervisor overrides</p>
          </div>
        </div>
      </div>

      {/* 7. Charts: Department Costs & Monthly Trends (High Contrast Slate & Dark Theme) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Salary Expenditure (Bar Chart) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Salary Expenditure by Department</h3>
              <p className="text-xs text-slate-400">Monthly contract wage commitments per business unit</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">INR (₹)</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptCosts} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="code" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val)), "Salary Cost"]}
                  labelFormatter={(lbl) => `Department: ${lbl}`}
                  contentStyle={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                />
                <Bar dataKey="total_salary_expenditure" fill="#0f172a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Net Salary Trend (Area Chart) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Monthly Payroll Payout Trend</h3>
              <p className="text-xs text-slate-400">Net salary disbursed across historical payroll runs</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">Historical Runs</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f172a" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val)), "Net Disbursed"]}
                  contentStyle={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                />
                <Area type="monotone" dataKey="net_salary" stroke="#0f172a" strokeWidth={2.5} fillOpacity={1} fill="url(#colorNet)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
