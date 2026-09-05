# PeoplePay360: HR & Payroll Operations Platform
**Odoo Hackathon Project**

PeoplePay360 is an enterprise-grade, integrated Human Resource and Payroll operations platform designed to eliminate silos between employee master records, attendance logs, leave balances, contracts, and salary computation.

---

## 🌟 Tech Stack Architecture
- **Frontend**: Next.js 14+ (App Router, React 18, TypeScript), Tailwind CSS, Shadcn UI, Three.js (`@react-three/fiber` & `@react-three/drei`), Lucide React, Framer Motion, Recharts.
- **Backend**: Python (FastAPI + Pydantic v2 + Uvicorn).
- **Database**: MongoDB Atlas (Async via Motor & Beanie ODM).
- **Dynamic Rule Engine**: Python AST / `asteval` (Safe dynamic math expression evaluation sandbox).
- **PDF Engine**: ReportLab (High-resolution, corporate-grade printable payslip PDFs).
- **Email Dispatcher**: FastAPI BackgroundTasks asynchronous mailer.

---

## 🚀 Quick Start Guide

### 1. Start FastAPI Backend
```bash
# In the root directory:
cd backend
.\venv\Scripts\activate
python main.py
```
* Backend API: `http://localhost:8000`
* Interactive Swagger Docs: `http://localhost:8000/docs`

### 2. Start Next.js Frontend
```bash
# In another terminal window:
cd frontend
npm run dev
```
* Web Application: `http://localhost:3000`

---

## 👥 Demo Personas & Credentials
In the top navigation bar, you can click the user avatar to switch personas instantly without logging in again:
- **System Admin**: `admin@peoplepay.com` / `password123` (Full system access)
- **HR Manager**: `hrmanager@peoplepay.com` / `password123` (CRUD on Employees, Attendance, Time Off Approvals)
- **Payroll Manager**: `payrollmgr@peoplepay.com` / `password123` (Full Payrun & Salary Rules CRUD)
- **Payroll User**: `payrolluser@peoplepay.com` / `password123` (Compute & view payruns)
- **Employee**: `employee@peoplepay.com` / `password123` (Self-service attendance & leaves)

---

## 🏆 Key Implemented Features (PDF Compliance)

1. **Centralized Employee Master Hub (`/employees`)**:
   - Toggleable **Kanban View** & **List View**.
   - **Smart Buttons (Live Counters)** on the Employee Form linking to filtered Contracts, Attendance, Time Off, and remaining Leave Balances.
2. **Temporal Contract Management (`/contracts`)**:
   - Clearly highlights currently active contract (`RUNNING`).
   - Strictly enforces date validation to prevent concurrent active contracts for the same employee.
3. **Working Schedules with Auto-Calculated Hours (`/schedules`)**:
   - 7-day pattern table (Start time, End time, Break duration).
   - Automatically sums and calculates daily and weekly hours in real time (no manual input).
4. **Time Off Lifecycle & Atomic Balance Deduction (`/time-off`)**:
   - When HR Manager approves a leave request, quota balance is atomically deducted from the employee's active allocation.
   - Unpaid leaves feed directly into payroll deductions.
5. **Attendance Exception Auditing (`/attendance`)**:
   - Quick check-in/out in navbar.
   - Automatic flags: `LATE` (after 09:15), `HALF_DAY` (< 4h), `OVERTIME` (> 9h).
   - Manual correction modal with mandatory audit note.
6. **Dynamic Salary Rule Engine (`/config`)**:
   - Sequential evaluation (`BASIC` -> `HRA` -> `GROSS` -> `PF` -> `TDS` -> `NET`).
   - Supports Fixed amounts, Percentages, and Python expressions evaluated in a safe AST sandbox.
7. **Two-Step Payrun Creation Wizard (`/payroll`)**:
   - **Step 1 (Scope)**: Select structure and pay period.
   - **Step 2 (Selection)**: Queries staff with active running contracts for that period; user selects employees with checkboxes.
   - Batch creation and draft payslip initialization.
8. **Payrun Processing Hub & Pre-Validation Warnings (`/payroll`)**:
   - Workflow: `DRAFT` -> `COMPUTED` -> `VALIDATED` -> `PAID`.
   - Pre-validation audit badges (⚠️ Missing bank details, ⚠️ Duplicate payslip, ⚠️ Zero attendance).
   - Disbursal marking and background bulk email delivery.
9. **Printable Payslip PDF (`/payroll/payslips/:id`)**:
   - Professional PDF payslip with earnings vs deductions breakdown, bank details, and net take-home salary generated on-the-fly.
10. **Interactive 3D Executive Dashboard (`/`)**:
    - Interactive **Three.js 3D Organization Sphere** reflecting live biometric nodes.
    - Live KPI cards, Recharts departmental expenditure bar chart, and monthly salary trend line chart.

---

## 🎬 5-Minute Live Presentation Script

1. **Introduction & Dashboard**:
   - Open `http://localhost:3000`. Show the interactive 3D Organization Sphere. Point out the live KPI cards and Department Expenditure chart.
2. **Employee Hub & Smart Buttons**:
   - Navigate to **Employees**. Switch between Kanban and List views. Click on **Carol Danvers** to open the Unified Employee Hub. Show how the **Smart Buttons** display live counts and link directly to her Contracts, Attendance, and Time Off.
3. **Time Off Approval & Atomic Balance Deduction**:
   - Navigate to **Time Off**. Show the pending leave request. Click **Approve**. Navigate to the **Allocations** tab and show that Carol's remaining leave balance has dropped atomically from 20 to 18 days.
4. **Two-Step Payrun Wizard**:
   - Navigate to **Payroll**. Click **New Payrun Wizard**.
   - Show **Step 1**: Select "March 2026 Regular Payroll" -> Click "Continue" (explain that no database record is created yet).
   - Show **Step 2**: The system automatically queries only employees holding active contracts for March 2026. Select the team -> Click "Create Payrun".
5. **Dynamic Rule Computation & Warnings**:
   - Click **Compute Payslips**. Show the real-time execution of the sequential Python AST rule engine.
   - Point out the pre-validation warning badge for **Eva Green** ("Missing bank account details"). Show that the system flags issues before disbursal.
6. **Validation, Disbursal & PDF Payslip**:
   - Click **Validate Batch** -> Click **Mark Paid** (celebratory confetti).
   - Click **Inspect** on Carol Danvers' payslip -> Click **Print / Download PDF Payslip**. Show the high-resolution corporate PDF generated by ReportLab!
