"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  TrendingUp,
  Users,
  CreditCard,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Building2,
  DollarSign,
  Activity,
  Filter,
  RotateCcw,
  Compass,
  Clock,
  Timer,
  AlertCircle,
  Edit3
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
import DemoTourModal from "@/components/DemoTourModal";

// Dynamic import for Three.js Canvas to avoid SSR issues
const ThreeCanvas = dynamic(() => import("@/components/ThreeCanvas"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[220px] rounded-xl bg-slate-900 animate-pulse flex items-center justify-center text-slate-400 text-xs">
      Loading 3D Organizational Mesh...
    </div>
  ),
});

export default function DashboardPage() {
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
  const [isDemoTourOpen, setIsDemoTourOpen] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod, selectedDept, selectedType]);

  const fetchDepartments = async () => {
    try {
      const res = await api.get("/departments");
      setDepartments(res.data);
    } catch (err) {
      console.error("Failed to load departments:", err);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedPeriod !== "ALL") params.append("period", selectedPeriod);
      if (selectedDept !== "ALL") params.append("department_id", selectedDept);
      if (selectedType !== "ALL") params.append("employment_type", selectedType);

      const deptCostsParams = new URLSearchParams();
      if (selectedType !== "ALL") deptCostsParams.append("employment_type", selectedType);

      const attParams = new URLSearchParams();
      if (selectedDept !== "ALL") attParams.append("department_id", selectedDept);

      const [statsRes, deptRes, trendsRes, alertsRes, attRes] = await Promise.all([
        api.get(`/dashboard/stats?${params.toString()}`),
        api.get(`/dashboard/department-costs?${deptCostsParams.toString()}`),
        api.get("/dashboard/monthly-trends"),
        api.get("/dashboard/alerts"),
        api.get(`/dashboard/attendance-overview?${attParams.toString()}`),
      ]);

      setStats(statsRes.data);
      setDeptCosts(deptRes.data);
      setMonthlyTrends(trendsRes.data);
      setAlerts(alertsRes.data);
      setAttendanceOverview(attRes.data);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSelectedPeriod("ALL");
    setSelectedDept("ALL");
    setSelectedType("ALL");
  };

  const hasActiveFilters = selectedPeriod !== "ALL" || selectedDept !== "ALL" || selectedType !== "ALL";

  return (
    <div className="space-y-6">
      {/* 1. Header with Title & 3D Interactive Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        <div className="lg:col-span-1 space-y-2">
          <div className="flex items-center space-x-2">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-odoo-purple/10 text-odoo-purple text-xs font-semibold">
              <Activity className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Live HR & Payroll Analytics</span>
              {loading && <span className="text-[10px] font-normal opacity-70 animate-pulse">(Syncing...)</span>}
            </div>
            <button
              onClick={() => setIsDemoTourOpen(true)}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold hover:bg-amber-200 transition-colors"
            >
              <Compass className="w-3.5 h-3.5 text-amber-700" />
              <span>Hackathon Demo Guide</span>
            </button>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Real-time synchronization across Employees, Contracts, Attendance logs, Time Off allocations, and Payroll disbursements.
          </p>
          <div className="pt-2 flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-medium">Active Database:</span>
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>MongoDB Atlas Connected</span>
            </span>
          </div>
        </div>

        {/* 3D Three.js Interactive Hero Canvas */}
        <div className="lg:col-span-2">
          <ThreeCanvas />
        </div>
      </div>

      {/* 2. MULTI-DIMENSIONAL FILTER BAR (Section A7 in Hackathon PDF) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
          <Filter className="w-4 h-4 text-odoo-purple" />
          <span>Multi-Dimensional Filters:</span>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 rounded-full bg-purple-50 text-odoo-purple text-[10px] font-bold border border-purple-200">
              Active Filters Applied
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Period Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium text-[11px]">Period:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Periods (YTD)</option>
              <option value="2026-03">March 2026</option>
              <option value="2026-02">February 2026</option>
              <option value="2026-01">January 2026</option>
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

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Operational Alerts Panel (Pre-validation Warnings) */}
      {alerts && alerts.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 shadow-subtle">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">Operational Attention Items</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {alerts.map((alt, idx) => (
              <div key={idx} className="flex items-center space-x-2 text-xs text-amber-800 bg-white/80 px-3 py-2 rounded-lg border border-amber-200/60 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span className="font-medium truncate">{alt.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Net Paid */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle hover:shadow-elevated transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Net Salary Paid</p>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-2">{formatCurrency(stats.total_net_paid)}</h2>
          <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" />
            <span>{selectedPeriod === "ALL" ? "All historical disbursements" : `${selectedPeriod} disbursements`}</span>
          </p>
        </div>

        {/* Payslips Generated */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle hover:shadow-elevated transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Payslips Processed</p>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-odoo-purple flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-2">{stats.total_payslips_generated}</h2>
          <p className="text-[11px] text-slate-500 font-medium mt-1 flex items-center">
            <span>Across {stats.active_employees_count} active staff</span>
          </p>
        </div>

        {/* Average Monthly Salary */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle hover:shadow-elevated transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Base Salary</p>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-2">{formatCurrency(stats.average_salary)}</h2>
          <p className="text-[11px] text-blue-600 font-medium mt-1">Filtered running contracts</p>
        </div>

        {/* Attendance Health Score */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle hover:shadow-elevated transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance Health</p>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-odoo-teal flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-2">{stats.attendance_health_percentage}%</h2>
          <p className="text-[11px] text-odoo-teal font-medium mt-1">On-time check-in ratio</p>
        </div>
      </div>

      {/* 5. DETAILED ATTENDANCE BREAKDOWN WIDGET (Section B9 in Hackathon PDF) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-odoo-purple" />
              <h3 className="text-sm font-bold text-slate-900">Attendance Compliance & Shift Exception Breakdown</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Granular breakdown of logs, punctuality infractions, overtime, missing check-outs, and manual edits (PDF Section B9).
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500">Punctuality Compliance:</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              {attendanceOverview.on_time_rate}% On-Time
            </span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2.5 mb-4 overflow-hidden flex">
          <div
            className="bg-emerald-500 h-full transition-all duration-500"
            style={{ width: `${Math.min(attendanceOverview.on_time_rate, 100)}%` }}
            title={`Present: ${attendanceOverview.present_count}`}
          />
          <div
            className="bg-amber-400 h-full transition-all duration-500"
            style={{
              width: `${
                attendanceOverview.total_records > 0
                  ? (attendanceOverview.late_count / attendanceOverview.total_records) * 100
                  : 0
              }%`,
            }}
            title={`Late: ${attendanceOverview.late_count}`}
          />
          <div
            className="bg-rose-500 h-full transition-all duration-500"
            style={{
              width: `${
                attendanceOverview.total_records > 0
                  ? (attendanceOverview.missing_checkout_count / attendanceOverview.total_records) * 100
                  : 0
              }%`,
            }}
            title={`Missing Checkouts: ${attendanceOverview.missing_checkout_count}`}
          />
        </div>

        {/* 6 Exception Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Present */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center space-x-1 text-emerald-800 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Present</span>
            </div>
            <p className="text-lg font-bold text-emerald-900 mt-1">{attendanceOverview.present_count}</p>
            <p className="text-[10px] text-emerald-700">Full shift completed</p>
          </div>

          {/* Late */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center space-x-1 text-amber-800 text-xs font-bold">
              <Timer className="w-3.5 h-3.5 text-amber-600" />
              <span>Late Arrivals</span>
            </div>
            <p className="text-lg font-bold text-amber-900 mt-1">{attendanceOverview.late_count}</p>
            <p className="text-[10px] text-amber-700">Grace period exceeded</p>
          </div>

          {/* Half Day */}
          <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center space-x-1 text-sky-800 text-xs font-bold">
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              <span>Half Day</span>
            </div>
            <p className="text-lg font-bold text-sky-900 mt-1">{attendanceOverview.half_day_count}</p>
            <p className="text-[10px] text-sky-700">&lt; 5.0 hours worked</p>
          </div>

          {/* Overtime */}
          <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center space-x-1 text-odoo-purple text-xs font-bold">
              <TrendingUp className="w-3.5 h-3.5 text-odoo-purple" />
              <span>Overtime</span>
            </div>
            <p className="text-lg font-bold text-purple-900 mt-1">{attendanceOverview.overtime_count}</p>
            <p className="text-[10px] text-purple-700">Extra hours logged</p>
          </div>

          {/* Missing Checkouts */}
          <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center space-x-1 text-rose-800 text-xs font-bold">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Missing Check-out</span>
            </div>
            <p className="text-lg font-bold text-rose-900 mt-1">{attendanceOverview.missing_checkout_count}</p>
            <p className="text-[10px] text-rose-700">Open sessions flagged</p>
          </div>

          {/* Manual Edits */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center space-x-1 text-slate-800 text-xs font-bold">
              <Edit3 className="w-3.5 h-3.5 text-slate-600" />
              <span>Manual Edits</span>
            </div>
            <p className="text-lg font-bold text-slate-900 mt-1">{attendanceOverview.manual_edits_count}</p>
            <p className="text-[10px] text-slate-500">Supervisor overrides</p>
          </div>
        </div>
      </div>

      {/* 6. Charts: Department Costs & Monthly Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Salary Expenditure (Bar Chart) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Salary Expenditure by Department</h3>
              <p className="text-xs text-slate-400">Monthly contract wage commitments per business unit</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">INR (₹)</span>
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
                <Bar dataKey="total_salary_expenditure" fill="#714B67" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Net Salary Trend (Area Chart) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Monthly Payroll Payout Trend</h3>
              <p className="text-xs text-slate-400">Net salary disbursed across historical payroll runs</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-50 text-odoo-purple">Historical</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#017E84" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#017E84" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val)), "Net Disbursed"]}
                  contentStyle={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                />
                <Area type="monotone" dataKey="net_salary" stroke="#017E84" strokeWidth={2.5} fillOpacity={1} fill="url(#colorNet)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Demo Tour Modal Component */}
      <DemoTourModal isOpen={isDemoTourOpen} onClose={() => setIsDemoTourOpen(false)} />
    </div>
  );
}
