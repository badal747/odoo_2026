from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from app.api.deps import get_current_user
from app.models.models import (
    Payrun, Payslip, Employee, Department, Attendance,
    TimeOffRequest, Contract, AttendanceStatus, EmploymentType
)

router = APIRouter(prefix="/dashboard", tags=["Payroll & HR Dashboard"], dependencies=[Depends(get_current_user)])

@router.get("/stats")
async def get_dashboard_stats(
    department_id: Optional[str] = None,
    employment_type: Optional[str] = None,
    period: Optional[str] = None
):
    # Base employee filter
    emp_query = {"status": "ACTIVE"}
    if department_id and department_id != "ALL":
        emp_query["department_id"] = department_id
    if employment_type and employment_type != "ALL":
        emp_query["employment_type"] = employment_type

    filtered_emps = await Employee.find(emp_query).to_list()
    emp_ids = [str(e.id) for e in filtered_emps]
    active_employees_count = len(filtered_emps)

    # Filtered contracts
    con_query = {"status": "RUNNING"}
    if department_id and department_id != "ALL":
        con_query["department_id"] = department_id
    if emp_ids:
        con_query["employee_id"] = {"$in": emp_ids}

    contracts = await Contract.find(con_query).to_list() if emp_ids else []
    avg_wage = (sum(c.wage for c in contracts) / len(contracts)) if contracts else 0.0

    # Total net paid & payslips count
    paid_payruns = await Payrun.find(Payrun.status == "PAID").to_list()
    if period and period != "ALL":
        # Period string format YYYY-MM
        paid_payruns = [
            p for p in paid_payruns
            if p.period_start.strftime("%Y-%m") == period
        ]

    total_net_paid = sum(p.total_net for p in paid_payruns)
    total_payslips = sum(p.total_employees for p in paid_payruns) if period and period != "ALL" else await Payslip.count()

    # Approved leave days
    leave_query = {"status": "APPROVED"}
    if emp_ids:
        leave_query["employee_id"] = {"$in": emp_ids}
    approved_leaves = await TimeOffRequest.find(leave_query).to_list() if emp_ids else []
    total_leave_days = sum(l.duration_units for l in approved_leaves)

    # Attendance Health: on-time vs late/absent (last 30 days)
    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)
    att_query = {"date": {"$gte": thirty_days_ago}}
    if emp_ids:
        att_query["employee_id"] = {"$in": emp_ids}
    
    attendances = await Attendance.find(att_query).to_list() if emp_ids else []
    total_att = len(attendances)
    on_time = len([a for a in attendances if a.status == AttendanceStatus.PRESENT])
    attendance_health = round((on_time / total_att * 100), 1) if total_att > 0 else 100.0

    return {
        "total_net_paid": round(total_net_paid, 2),
        "total_payslips_generated": total_payslips,
        "average_salary": round(avg_wage, 2),
        "approved_time_off_days": round(total_leave_days, 1),
        "attendance_health_percentage": attendance_health,
        "active_employees_count": active_employees_count,
        "filtered_employees_count": active_employees_count
    }

@router.get("/attendance-overview")
async def get_attendance_overview(department_id: Optional[str] = None):
    """
    Detailed attendance breakdown (Section B9 of Hackathon PDF):
    Present, Late, Half-day, Overtime, Missing check-outs, and Manual Edits.
    """
    emp_ids = None
    if department_id and department_id != "ALL":
        emps = await Employee.find(Employee.department_id == department_id).to_list()
        emp_ids = [str(e.id) for e in emps]

    query = {}
    if emp_ids is not None:
        query["employee_id"] = {"$in": emp_ids}

    records = await Attendance.find(query).to_list()
    total = len(records)
    
    present = len([a for a in records if a.status == AttendanceStatus.PRESENT])
    late = len([a for a in records if a.status == AttendanceStatus.LATE])
    half_day = len([a for a in records if a.status == AttendanceStatus.HALF_DAY])
    overtime = len([a for a in records if a.status == AttendanceStatus.OVERTIME])
    missing_checkout = len([a for a in records if not a.check_out])
    manual_edits = len([a for a in records if a.is_manual_edit])

    rate = round((present / total * 100), 1) if total > 0 else 100.0

    return {
        "total_records": total,
        "present_count": present,
        "late_count": late,
        "half_day_count": half_day,
        "overtime_count": overtime,
        "missing_checkout_count": missing_checkout,
        "manual_edits_count": manual_edits,
        "on_time_rate": rate
    }

@router.get("/department-costs")
async def get_department_costs(employment_type: Optional[str] = None):
    """
    Returns salary expenditure and headcount by department with optional employee type filter.
    """
    departments = await Department.find_all().to_list()
    res = []
    
    for dept in departments:
        dept_id = str(dept.id)
        
        emp_filter = {
            "department_id": dept_id,
            "status": "ACTIVE"
        }
        if employment_type and employment_type != "ALL":
            emp_filter["employment_type"] = employment_type

        dept_emps = await Employee.find(emp_filter).to_list()
        dept_emp_ids = [str(e.id) for e in dept_emps]
        headcount = len(dept_emps)

        if dept_emp_ids:
            contracts = await Contract.find({
                "department_id": dept_id,
                "status": "RUNNING",
                "employee_id": {"$in": dept_emp_ids}
            }).to_list()
            total_salary_expense = sum(c.wage for c in contracts)
        else:
            total_salary_expense = 0.0

        res.append({
            "department_id": dept_id,
            "department_name": dept.name,
            "code": dept.code,
            "headcount": headcount,
            "total_salary_expenditure": round(total_salary_expense, 2),
            "avg_salary": round(total_salary_expense / headcount, 2) if headcount > 0 else 0.0
        })

    return res

@router.get("/monthly-trends")
async def get_monthly_trends():
    """
    Monthly salary expenditure trend using historical Payruns.
    """
    payruns = await Payrun.find_all().sort("period_start").to_list()
    res = []
    for p in payruns:
        month_label = p.period_start.strftime("%b %Y")
        res.append({
            "period": month_label,
            "gross_salary": p.total_gross,
            "net_salary": p.total_net,
            "deductions": p.total_deductions,
            "employees_count": p.total_employees
        })
    return res

@router.get("/alerts")
async def get_operational_alerts():
    """
    Returns actionable alerts:
    - Pending time off requests
    - Expiring contracts in next 30 days
    - Draft payruns needing attention
    - Missing bank details count
    """
    now = datetime.utcnow()
    thirty_days_later = now + timedelta(days=30)

    pending_leaves = await TimeOffRequest.find(TimeOffRequest.status == "PENDING").count()
    
    expiring_contracts = await Contract.find(
        Contract.status == "RUNNING",
        Contract.end_date != None,
        Contract.end_date <= thirty_days_later
    ).count()

    draft_payruns = await Payrun.find(Payrun.status == "DRAFT").count()

    # Missing bank accounts
    all_emps = await Employee.find(Employee.status == "ACTIVE").to_list()
    missing_bank = len([e for e in all_emps if not e.bank_details or not e.bank_details.account_number])

    alerts = []
    if pending_leaves > 0:
        alerts.append({"type": "warning", "message": f"{pending_leaves} Time Off requests awaiting HR approval."})
    if expiring_contracts > 0:
        alerts.append({"type": "info", "message": f"{expiring_contracts} employment contracts expiring within 30 days."})
    if draft_payruns > 0:
        alerts.append({"type": "info", "message": f"{draft_payruns} draft payrun batch requires rule computation."})
    if missing_bank > 0:
        alerts.append({"type": "error", "message": f"{missing_bank} active employees have missing bank account numbers."})

    return alerts
