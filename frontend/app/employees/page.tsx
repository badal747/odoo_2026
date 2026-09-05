"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  LayoutGrid,
  List as ListIcon,
  Plus,
  Mail,
  Phone,
  Building,
  Briefcase,
  UserCheck,
  FileText,
  Clock,
  Calendar,
  CreditCard,
  X,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [loading, setLoading] = useState(true);

  // Selected Employee for the Unified Form / Drawer
  const [activeEmployee, setActiveEmployee] = useState<any>(null);
  const [smartCounts, setSmartCounts] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Create Employee Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newEmp, setNewEmp] = useState({
    employee_code: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    department_id: "",
    job_position_id: "",
    manager_id: "",
    working_schedule_id: "",
    bank_name: "HDFC Bank",
    account_number: "",
    pan_or_tax_id: ""
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [empRes, deptRes, posRes, schRes] = await Promise.all([
        api.get("/employees"),
        api.get("/employees/departments/all"),
        api.get("/employees/positions/all"),
        api.get("/schedules"),
      ]);
      setEmployees(empRes.data);
      setDepartments(deptRes.data);
      setPositions(posRes.data);
      setSchedules(schRes.data);
    } catch (err) {
      console.error("Failed to load employee data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEmployee = async (emp: any) => {
    setActiveEmployee(emp);
    setIsFormOpen(true);
    try {
      const res = await api.get(`/employees/${emp.id}/smart-counts`);
      setSmartCounts(res.data);
    } catch (err) {
      console.error("Error fetching smart counts:", err);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/employees", {
        employee_code: newEmp.employee_code,
        first_name: newEmp.first_name,
        last_name: newEmp.last_name,
        email: newEmp.email,
        phone: newEmp.phone,
        department_id: newEmp.department_id,
        job_position_id: newEmp.job_position_id,
        manager_id: newEmp.manager_id || null,
        working_schedule_id: newEmp.working_schedule_id || null,
        bank_details: {
          bank_name: newEmp.bank_name,
          account_number: newEmp.account_number,
          pan_or_tax_id: newEmp.pan_or_tax_id
        }
      });
      setIsCreateOpen(false);
      fetchInitialData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to create employee");
    }
  };

  const filteredEmployees = employees.filter((e) => {
    const matchesSearch =
      `${e.first_name} ${e.last_name} ${e.employee_code} ${e.email}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept ? e.department_id === selectedDept : true;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-subtle">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Users className="w-5 h-5 text-odoo-purple" />
            <span>Employee Master Hub</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Centralized operational profiles with smart navigation to Contracts, Attendance, and Time Off.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Mode Toggle: Kanban vs List */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center space-x-1 transition-colors ${
                viewMode === "kanban" ? "bg-white text-odoo-purple shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
              title="Kanban View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center space-x-1 transition-colors ${
                viewMode === "list" ? "bg-white text-odoo-purple shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
              title="List View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-odoo-purple hover:bg-odoo-purpleHover text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Employee</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by employee name, code (EMP001), or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple text-slate-900"
          />
        </div>

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="w-full sm:w-56 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-odoo-purple/20"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.code})
            </option>
          ))}
        </select>
      </div>

      {/* KANBAN VIEW */}
      {viewMode === "kanban" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredEmployees.map((emp) => (
            <div
              key={emp.id}
              onClick={() => handleOpenEmployee(emp)}
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-odoo-purple/40 hover:shadow-elevated transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={emp.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                      alt={emp.first_name}
                      className="w-11 h-11 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-odoo-purple transition-colors">
                        {emp.first_name} {emp.last_name}
                      </h3>
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {emp.employee_code}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      emp.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {emp.status}
                  </span>
                </div>

                <div className="mt-3.5 space-y-1 text-xs text-slate-600">
                  <p className="flex items-center font-medium text-slate-800">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
                    <span className="truncate">{emp.job_position_title}</span>
                  </p>
                  <p className="flex items-center text-slate-500">
                    <Building className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
                    <span className="truncate">{emp.department_name}</span>
                  </p>
                  <p className="flex items-center text-slate-500">
                    <Mail className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
                    <span className="truncate">{emp.email}</span>
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-odoo-purple font-medium">
                <span>View Full Hub</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-subtle">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Position</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map((emp) => (
                <tr
                  key={emp.id}
                  onClick={() => handleOpenEmployee(emp)}
                  className="hover:bg-purple-50/40 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-semibold text-slate-900">{emp.employee_code}</td>
                  <td className="px-4 py-3 font-medium text-slate-900 flex items-center space-x-2">
                    <img src={emp.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} className="w-6 h-6 rounded-full" />
                    <span>{emp.first_name} {emp.last_name}</span>
                  </td>
                  <td className="px-4 py-3">{emp.department_name}</td>
                  <td className="px-4 py-3">{emp.job_position_title}</td>
                  <td className="px-4 py-3 text-slate-500">{emp.email}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-odoo-purple font-semibold hover:underline">Open Hub</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* UNIFIED EMPLOYEE FORM / OPERATIONAL HUB (MODAL / DRAWER) */}
      {isFormOpen && activeEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-floating border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            {/* Form Top Banner with SMART BUTTONS */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={activeEmployee.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                />
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {activeEmployee.first_name} {activeEmployee.last_name}
                  </h2>
                  <p className="text-xs text-slate-500">{activeEmployee.job_position_title} &bull; {activeEmployee.employee_code}</p>
                </div>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SMART BUTTONS BAR (As required in PDF section A1, B2) */}
            <div className="bg-purple-50/50 border-b border-purple-100 px-6 py-2.5 flex items-center space-x-2 overflow-x-auto">
              <Link
                href={`/contracts?employee_id=${activeEmployee.id}`}
                className="flex items-center space-x-2 px-3 py-1.5 bg-white rounded-lg border border-slate-200 hover:border-odoo-purple text-xs font-semibold text-slate-800 shadow-sm transition-all"
              >
                <FileText className="w-3.5 h-3.5 text-odoo-purple" />
                <span>Contracts</span>
                <span className="ml-1 px-1.5 py-0.2 rounded bg-purple-100 text-odoo-purple text-[10px]">
                  {smartCounts ? smartCounts.contracts_count : "..."}
                </span>
              </Link>

              <Link
                href={`/attendance?employee_id=${activeEmployee.id}`}
                className="flex items-center space-x-2 px-3 py-1.5 bg-white rounded-lg border border-slate-200 hover:border-odoo-teal text-xs font-semibold text-slate-800 shadow-sm transition-all"
              >
                <Clock className="w-3.5 h-3.5 text-odoo-teal" />
                <span>Attendance</span>
                <span className="ml-1 px-1.5 py-0.2 rounded bg-teal-100 text-odoo-teal text-[10px]">
                  {smartCounts ? smartCounts.attendance_count : "..."}
                </span>
              </Link>

              <Link
                href={`/time-off?employee_id=${activeEmployee.id}`}
                className="flex items-center space-x-2 px-3 py-1.5 bg-white rounded-lg border border-slate-200 hover:border-blue-500 text-xs font-semibold text-slate-800 shadow-sm transition-all"
              >
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>Time Off Requests</span>
                <span className="ml-1 px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 text-[10px]">
                  {smartCounts ? smartCounts.approved_leaves_count : "..."}
                </span>
              </Link>

              <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200 text-xs font-semibold text-emerald-800">
                <span>Leave Balance:</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-900 text-[10px]">
                  {smartCounts ? `${smartCounts.leave_balance_remaining} Days` : "..."}
                </span>
              </div>
            </div>

            {/* Employee Form Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Active Contract Alert */}
              {smartCounts && smartCounts.active_contract_wage ? (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span><b>Active Running Contract:</b> Wage ₹{smartCounts.active_contract_wage.toLocaleString()}/month</span>
                  </div>
                  <Link href={`/contracts?employee_id=${activeEmployee.id}`} className="font-semibold underline">
                    Inspect Terms
                  </Link>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center space-x-2 text-xs text-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>No active RUNNING contract for current payroll period.</span>
                </div>
              )}

              {/* Work Details Grid */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Work & Hierarchy Details</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Department</span>
                    <span className="font-semibold text-slate-800">{activeEmployee.department_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Job Position</span>
                    <span className="font-semibold text-slate-800">{activeEmployee.job_position_title}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Employment Type</span>
                    <span className="font-semibold text-slate-800">{activeEmployee.employment_type}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Manager</span>
                    <span className="font-semibold text-slate-800">{activeEmployee.manager_name || "Alice Johnson"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Working Schedule</span>
                    <span className="font-semibold text-slate-800">Standard 40 Hours</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Status</span>
                    <span className="font-semibold text-emerald-700">{activeEmployee.status}</span>
                  </div>
                </div>
              </div>

              {/* Bank & Tax Details (Crucial for Pre-Payroll Warnings) */}
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Bank & Tax Account Information</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Bank Name</span>
                    <span className="font-semibold text-slate-800">{activeEmployee.bank_details?.bank_name || <span className="text-rose-500 font-bold">MISSING</span>}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Account Number</span>
                    <span className="font-semibold text-slate-800">{activeEmployee.bank_details?.account_number || <span className="text-rose-500 font-bold">MISSING</span>}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">PAN / Tax ID</span>
                    <span className="font-semibold text-slate-800">{activeEmployee.bank_details?.pan_or_tax_id || <span className="text-rose-500 font-bold">MISSING</span>}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg"
              >
                Close Hub
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE EMPLOYEE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-floating border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Add New Employee Profile</h2>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="p-6 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Employee Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="EMP006"
                    value={newEmp.employee_code}
                    onChange={(e) => setNewEmp({ ...newEmp, employee_code: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="user@peoplepay.com"
                    value={newEmp.email}
                    onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newEmp.first_name}
                    onChange={(e) => setNewEmp({ ...newEmp, first_name: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={newEmp.last_name}
                    onChange={(e) => setNewEmp({ ...newEmp, last_name: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Department *</label>
                  <select
                    required
                    value={newEmp.department_id}
                    onChange={(e) => setNewEmp({ ...newEmp, department_id: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Position *</label>
                  <select
                    required
                    value={newEmp.job_position_id}
                    onChange={(e) => setNewEmp({ ...newEmp, job_position_id: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="">Select Position</option>
                    {positions.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <h4 className="font-bold text-slate-800 mb-2">Bank & Tax Account (For Payroll)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Account Number</label>
                    <input
                      type="text"
                      placeholder="501002345678"
                      value={newEmp.account_number}
                      onChange={(e) => setNewEmp({ ...newEmp, account_number: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">PAN / Tax ID</label>
                    <input
                      type="text"
                      placeholder="ABCDE1234F"
                      value={newEmp.pan_or_tax_id}
                      onChange={(e) => setNewEmp({ ...newEmp, pan_or_tax_id: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-2 border rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-odoo-purple text-white rounded-lg font-semibold hover:bg-odoo-purpleHover"
                >
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
