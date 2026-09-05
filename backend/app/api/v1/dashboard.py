from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter
from app.models.models import (
    Payrun, Payslip, Employee, Department, Attendance,
    TimeOffRequest, Contract, AttendanceStatus
)

router = APIRouter(prefix="/dashboard", tags=["Payroll & HR Dashboard"])

@router.get("/stats")
async def get_dashboard_stats(department_id: Optional[str] = None):
    # Total net paid & payslips count
    paid_payruns = await Payrun.find(Payrun.status == "PAID").to_list()
    total_net_paid = sum(p.total_net for p in paid_payruns)
    total_payslips = await Payslip.count()

    # Active contracts average wage
    contracts = await Contract.find(Contract.status == "RUNNING").to_list()
    avg_wage = (sum(c.wage for c in contracts) / len(contracts)) if contracts else 0.0

    # Approved leave days
    approved_leaves = await TimeOffRequest.find(TimeOffRequest.status == "APPROVED").to_list()
    total_leave_days = sum(l.duration_units for l in approved_leaves)

    # Attendance Health: on-time vs late/absent
    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)
    attendances = await Attendance.find(Attendance.date >= thirty_days_ago).to_list()
    total_att = len(attendances)
    on_time = len([a for a in attendances if a.status == AttendanceStatus.PRESENT])
    attendance_health = round((on_time / total_att * 100), 1) if total_att > 0 else 100.0

    return {
        "total_net_paid": round(total_net_paid, 2),
        "total_payslips_generated": total_payslips,
        "average_salary": round(avg_wage, 2),
        "approved_time_off_days": round(total_leave_days, 1),
        "attendance_health_percentage": attendance_health,
        "active_employees_count": await Employee.find(Employee.status == "ACTIVE").count()
    }

@router.get("/department-costs")
async def get_department_costs():
    """
    Returns salary expenditure and headcount by department.
    """
    departments = await Department.find_all().to_list()
    res = []
    
    for dept in departments:
        dept_id = str(dept.id)
        # Find active contracts in this department
        contracts = await Contract.find(
            Contract.department_id == dept_id,
            Contract.status == "RUNNING"
        ).to_list()

        headcount = await Employee.find(
            Employee.department_id == dept_id,
            Employee.status == "ACTIVE"
        ).count()

        total_salary_expense = sum(c.wage for c in contracts)
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
