import asyncio
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from app.api.deps import get_current_user
from app.core.cache import fast_cache
from app.models.models import (
    Payrun, Payslip, Employee, Department, Attendance,
    TimeOffRequest, Contract, AttendanceStatus, EmploymentType
)

router = APIRouter(prefix="/dashboard", tags=["Payroll & HR Dashboard"], dependencies=[Depends(get_current_user)])

@router.get("/stats")
async def get_dashboard_stats(
    department_id: Optional[str] = None,
    employment_type: Optional[str] = None,
    period: Optional[str] = None,
    fresh: bool = False
):
    cache_key = f"dashboard:stats:{department_id}:{employment_type}:{period}"
    if not fresh:
        cached = fast_cache.get(cache_key)
        if cached:
            return cached

    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)

    # Base employee filter
    emp_query = {"status": "ACTIVE"}
    if department_id and department_id != "ALL":
        emp_query["department_id"] = department_id
    if employment_type and employment_type != "ALL":
        emp_query["employment_type"] = employment_type

    # Parallel Phase 1: Base collections
    filtered_emps, paid_payruns, all_payruns = await asyncio.gather(
        Employee.find(emp_query).to_list(),
        Payrun.find(Payrun.status == "PAID").to_list(),
        Payrun.find_all().to_list(),
    )
    emp_ids = [str(e.id) for e in filtered_emps]
    active_employees_count = len(filtered_emps)

    # Dependent filters
    con_query = {"status": "RUNNING"}
    if department_id and department_id != "ALL":
        con_query["department_id"] = department_id
    if emp_ids:
        con_query["employee_id"] = {"$in": emp_ids}

    leave_query = {"status": "APPROVED"}
    if emp_ids:
        leave_query["employee_id"] = {"$in": emp_ids}

    att_query = {"date": {"$gte": thirty_days_ago}}
    if emp_ids:
        att_query["employee_id"] = {"$in": emp_ids}

    async def get_empty():
        return []

    contracts_task = Contract.find(con_query).to_list() if emp_ids else get_empty()
    leaves_task = TimeOffRequest.find(leave_query).to_list() if emp_ids else get_empty()
    att_task = Attendance.find(att_query).to_list() if emp_ids else get_empty()
    slip_task = Payslip.count() if not (period and period != "ALL") else get_empty()

    # Parallel Phase 2: Contracts, Leaves, Attendance, and Payslips
    contracts, approved_leaves, attendances, total_payslip_count = await asyncio.gather(
        contracts_task,
        leaves_task,
        att_task,
        slip_task
    )

    avg_wage = (sum(c.wage for c in contracts) / len(contracts)) if contracts else 0.0

    if period and period != "ALL":
        paid_payruns = [
            p for p in paid_payruns
            if p.period_start and p.period_start.strftime("%Y-%m") == period
        ]

    total_net_paid = sum(p.total_net for p in paid_payruns)
    total_payslips = sum(p.total_employees for p in paid_payruns) if period and period != "ALL" else total_payslip_count
    total_leave_days = sum(l.duration_units for l in approved_leaves)

    total_att = len(attendances)
    on_time = len([a for a in attendances if a.status == AttendanceStatus.PRESENT])
    attendance_health = round((on_time / total_att * 100), 1) if total_att > 0 else 100.0

    available_periods = sorted(list({p.period_start.strftime("%Y-%m") for p in all_payruns if p.period_start}), reverse=True)
    if not available_periods:
        available_periods = [
            (now - timedelta(days=30 * i)).strftime("%Y-%m") for i in range(4)
        ]

    result = {
        "total_net_paid": round(total_net_paid, 2),
        "total_payslips_generated": total_payslips,
        "average_salary": round(avg_wage, 2),
        "approved_time_off_days": round(total_leave_days, 1),
        "attendance_health_percentage": attendance_health,
        "active_employees_count": active_employees_count,
        "filtered_employees_count": active_employees_count,
        "available_periods": available_periods,
    }
    fast_cache.set(cache_key, result, ttl=4.0)
    return result

@router.get("/attendance-overview")
async def get_attendance_overview(department_id: Optional[str] = None, fresh: bool = False):
    """
    Detailed attendance breakdown (Section B9 of Hackathon PDF):
    Present, Late, Half-day, Overtime, Missing check-outs, and Manual Edits.
    """
    cache_key = f"dashboard:attendance-overview:{department_id}"
    if not fresh:
        cached = fast_cache.get(cache_key)
        if cached:
            return cached

    query = {}
    if department_id and department_id != "ALL":
        emps = await Employee.find(Employee.department_id == department_id).to_list()
        emp_ids = [str(e.id) for e in emps]
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

    result = {
        "total_records": total,
        "present_count": present,
        "late_count": late,
        "half_day_count": half_day,
        "overtime_count": overtime,
        "missing_checkout_count": missing_checkout,
        "manual_edits_count": manual_edits,
        "on_time_rate": rate
    }
    fast_cache.set(cache_key, result, ttl=4.0)
    return result

@router.get("/department-costs")
async def get_department_costs(employment_type: Optional[str] = None, fresh: bool = False):
    """
    Blazing fast single-pass salary expenditure & headcount aggregation.
    Replaces 10+ sequential DB roundtrips with 1 parallel fetch.
    """
    cache_key = f"dashboard:dept-costs:{employment_type}"
    if not fresh:
        cached = fast_cache.get(cache_key)
        if cached:
            return cached

    departments, all_emps, all_contracts = await asyncio.gather(
        Department.find_all().to_list(),
        Employee.find({"status": "ACTIVE"}).to_list(),
        Contract.find({"status": "RUNNING"}).to_list()
    )

    if employment_type and employment_type != "ALL":
        all_emps = [e for e in all_emps if e.employment_type == employment_type]

    emp_dept_map = {str(e.id): e.department_id for e in all_emps}
    dept_emps_count = {}
    for e in all_emps:
        dept_emps_count[e.department_id] = dept_emps_count.get(e.department_id, 0) + 1

    dept_contract_wages = {}
    for c in all_contracts:
        if c.employee_id in emp_dept_map:
            dept_id = emp_dept_map[c.employee_id]
            dept_contract_wages[dept_id] = dept_contract_wages.get(dept_id, 0.0) + c.wage

    res = []
    for dept in departments:
        dept_id = str(dept.id)
        headcount = dept_emps_count.get(dept_id, 0)
        total_salary_expense = dept_contract_wages.get(dept_id, 0.0)

        res.append({
            "department_id": dept_id,
            "department_name": dept.name,
            "code": dept.code,
            "headcount": headcount,
            "total_salary_expenditure": round(total_salary_expense, 2),
            "avg_salary": round(total_salary_expense / headcount, 2) if headcount > 0 else 0.0
        })

    fast_cache.set(cache_key, res, ttl=4.0)
    return res

@router.get("/monthly-trends")
async def get_monthly_trends(fresh: bool = False):
    """
    Monthly salary expenditure trend using historical Payruns with caching.
    """
    cache_key = "dashboard:monthly-trends"
    if not fresh:
        cached = fast_cache.get(cache_key)
        if cached:
            return cached

    payruns = await Payrun.find_all().sort("period_start").to_list()
    res = []
    for p in payruns:
        month_label = p.period_start.strftime("%b %Y") if p.period_start else "N/A"
        res.append({
            "period": month_label,
            "gross_salary": p.total_gross,
            "net_salary": p.total_net,
            "deductions": p.total_deductions,
            "employees_count": p.total_employees
        })

    fast_cache.set(cache_key, res, ttl=4.0)
    return res

@router.get("/alerts")
async def get_operational_alerts(fresh: bool = False):
    """
    Returns actionable alerts running all checks concurrently via asyncio.gather.
    """
    cache_key = "dashboard:alerts"
    if not fresh:
        cached = fast_cache.get(cache_key)
        if cached:
            return cached

    now = datetime.utcnow()
    thirty_days_later = now + timedelta(days=30)

    pending_leaves, expiring_contracts, draft_payruns, all_emps = await asyncio.gather(
        TimeOffRequest.find(TimeOffRequest.status == "PENDING").count(),
        Contract.find(
            Contract.status == "RUNNING",
            Contract.end_date != None,
            Contract.end_date <= thirty_days_later
        ).count(),
        Payrun.find(Payrun.status == "DRAFT").count(),
        Employee.find(Employee.status == "ACTIVE").to_list()
    )

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

    fast_cache.set(cache_key, alerts, ttl=4.0)
    return alerts

