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
  ArrowUpRight
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

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
    total_net_paid: 268860,
    total_payslips_generated: 4,
    average_salary: 97000,
    approved_time_off_days: 2.0,
    attendance_health_percentage: 100.0,
    active_employees_count: 5,
  });
  const [deptCosts, setDeptCosts] = useState<any[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, deptRes, trendsRes, alertsRes] = await Promise.all([
        api.get("/dashboard/stats"),
        api.get("/dashboard/department-costs"),
        api.get("/dashboard/monthly-trends"),
        api.get("/dashboard/alerts"),
      ]);
      setStats(statsRes.data);
      setDeptCosts(deptRes.data);
      setMonthlyTrends(trendsRes.data);
      setAlerts(alertsRes.data);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Title & 3D Interactive Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        <div className="lg:col-span-1 space-y-2">
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-odoo-purple/10 text-odoo-purple text-xs font-semibold">
            <Activity className="w-3.5 h-3.5" />
            <span>Live HR & Payroll Analytics</span>
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

      {/* 2. Operational Alerts Panel (Pre-validation Warnings) */}
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

      {/* 3. KPI Stat Cards */}
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
            <span>Historical payruns disbursed</span>
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
          <p className="text-[11px] text-blue-600 font-medium mt-1">Based on running contracts</p>
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

      {/* 4. Charts: Department Costs & Monthly Trends */}
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
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(v) => `₹${v/1000}k`} />
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
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(v) => `₹${v/1000}k`} />
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
    </div>
  );
}
