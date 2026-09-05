import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel
from app.api.deps import require_roles
from app.models.models import (
    Payrun, Payslip, Employee, Contract, SalaryStructure, SalaryRule,
    Attendance, TimeOffRequest, PayrunStatus, UserRole
)
from app.services.payroll_engine import evaluate_salary_rules
from app.services.pdf_service import generate_payslip_pdf

router = APIRouter(
    prefix="/payruns",
    tags=["Payruns & Payslips"],
    dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.HR_PAYROLL_MANAGER, UserRole.HR_PAYROLL_USER))]
)

class WizardScopeRequest(BaseModel):
    salary_structure_id: str
    period_start: datetime
    period_end: datetime

class CreateBatchRequest(BaseModel):
    name: str
    salary_structure_id: str
    period_start: datetime
    period_end: datetime
    selected_employee_ids: List[str]

# ----------------- STEP 1: WIZARD ELIGIBILITY CHECK -----------------
@router.post("/wizard-eligible")
async def get_wizard_eligible_employees(req: WizardScopeRequest):
    """
    Step 1 of Wizard: Filters eligible staff who have an active (RUNNING)
    contract matching the period and salary structure.
    Does NOT create any database records!
    """
    # Find all running contracts overlapping the period
    contracts = await Contract.find(
        Contract.status == "RUNNING",
        Contract.salary_structure_id == req.salary_structure_id,
        Contract.start_date <= req.period_end,
        {"$or": [{"end_date": None}, {"end_date": {"$gte": req.period_start}}]}
    ).to_list()

    emp_ids = [c.employee_id for c in contracts]
    employees = await Employee.find({"_id": {"$in": [uuid_or_str for uuid_or_str in emp_ids]}}).to_list() if emp_ids else []
    
    # Also fetch all employees to match by string id
    all_emps = {str(e.id): e for e in await Employee.find_all().to_list()}

    eligible = []
    for c in contracts:
        emp = all_emps.get(c.employee_id)
        if emp:
            eligible.append({
                "employee_id": str(emp.id),
                "employee_code": emp.employee_code,
                "name": f"{emp.first_name} {emp.last_name}",
                "email": emp.email,
                "contract_code": c.contract_code,
                "contract_id": str(c.id),
                "wage": c.wage,
                "has_bank_details": bool(emp.bank_details and emp.bank_details.account_number)
            })

    return {
        "eligible_count": len(eligible),
        "employees": eligible
    }

# ----------------- STEP 2: CREATE BATCH & DRAFT PAYSLIPS -----------------
@router.post("/create-batch")
async def create_payrun_batch(req: CreateBatchRequest):
    """
    Step 2 of Wizard: Creates the Payrun batch and initializes draft
    Payslips ONLY for explicitly selected staff.
    """
    if not req.selected_employee_ids:
        raise HTTPException(status_code=400, detail="Please select at least one employee")

    # Create Payrun
    payrun = Payrun(
        name=req.name,
        period_start=req.period_start,
        period_end=req.period_end,
        salary_structure_id=req.salary_structure_id,
        status=PayrunStatus.DRAFT,
        selected_employee_ids=req.selected_employee_ids,
        total_employees=len(req.selected_employee_ids)
    )
    await payrun.insert()

    # Initialize draft payslips
    seq = 1
    month_code = req.period_start.strftime("%Y/%m")
    for emp_id in req.selected_employee_ids:
        # Find applicable contract
        contract = await Contract.find_one(
            Contract.employee_id == emp_id,
            Contract.status == "RUNNING",
            Contract.start_date <= req.period_end,
            {"$or": [{"end_date": None}, {"end_date": {"$gte": req.period_start}}]}
        )
        if not contract:
            continue

        slip_num = f"SLIP/{month_code}/{seq:03d}"
        seq += 1

        payslip = Payslip(
            payslip_number=slip_num,
            payrun_id=str(payrun.id),
            employee_id=emp_id,
            contract_id=str(contract.id),
            period_start=req.period_start,
            period_end=req.period_end,
            status="DRAFT"
        )
        await payslip.insert()

    return {
        "id": str(payrun.id),
        "message": f"Payrun batch created with {len(req.selected_employee_ids)} draft payslips",
        "payrun": payrun.dict()
    }

# ----------------- PAYRUN HUB ACTIONS -----------------
@router.get("")
async def list_payruns():
    payruns = await Payrun.find_all().sort("-created_at").to_list()
    struct_map = {str(s.id): s.name for s in await SalaryStructure.find_all().to_list()}

    res = []
    for p in payruns:
        d = p.dict()
        d["id"] = str(p.id)
        d["structure_name"] = struct_map.get(p.salary_structure_id, "Unknown")
        res.append(d)
    return res

@router.get("/{id}")
async def get_payrun(id: str):
    payrun = await Payrun.get(id)
    if not payrun:
        raise HTTPException(status_code=404, detail="Payrun not found")

    struct = await SalaryStructure.get(payrun.salary_structure_id)
    payslips = await Payslip.find(Payslip.payrun_id == id).to_list()
    emp_map = {str(e.id): e for e in await Employee.find_all().to_list()}
    contract_map = {str(c.id): c for c in await Contract.find_all().to_list()}

    sl_res = []
    for s in payslips:
        emp = emp_map.get(s.employee_id)
        con = contract_map.get(s.contract_id)
        sl_res.append({
            "id": str(s.id),
            "payslip_number": s.payslip_number,
            "employee_id": s.employee_id,
            "employee_name": f"{emp.first_name} {emp.last_name}" if emp else "Unknown",
            "employee_code": emp.employee_code if emp else "Unknown",
            "contract_code": con.contract_code if con else "Unknown",
            "worked_days": s.worked_days,
            "unpaid_leave_days": s.unpaid_leave_days,
            "basic_salary": s.basic_salary,
            "gross_salary": s.gross_salary,
            "total_deductions": s.total_deductions,
            "net_salary": s.net_salary,
            "status": s.status,
            "warnings": s.warnings,
            "lines": [l.dict() for l in s.lines]
        })

    d = payrun.dict()
    d["id"] = str(payrun.id)
    d["structure_name"] = struct.name if struct else "Unknown"
    d["payslips"] = sl_res
    return d

@router.post("/{id}/compute")
async def compute_payrun(id: str):
    """
    Computes all payslips in the Payrun batch:
    1. Fetches applicable contract
    2. Calculates attendance worked days and unpaid leaves
    3. Executes dynamic Python AST salary rule evaluator
    4. Evaluates pre-validation warnings
    """
    payrun = await Payrun.get(id)
    if not payrun:
        raise HTTPException(status_code=404, detail="Payrun not found")
    if payrun.status == PayrunStatus.PAID:
        raise HTTPException(status_code=400, detail="Cannot recalculate a finalized PAID payrun")

    rules = await SalaryRule.find(SalaryRule.structure_id == payrun.salary_structure_id, SalaryRule.active == True).to_list()
    payslips = await Payslip.find(Payslip.payrun_id == id).to_list()

    tot_gross = 0.0
    tot_ded = 0.0
    tot_net = 0.0

    for slip in payslips:
        emp = await Employee.get(slip.employee_id)
        contract = await Contract.get(slip.contract_id)
        if not emp or not contract:
            continue

        # 1. Attendance worked days calculation
        attendances = await Attendance.find(
            Attendance.employee_id == slip.employee_id,
            Attendance.date >= payrun.period_start,
            Attendance.date <= payrun.period_end
        ).to_list()
        
        # Approximate worked days: sum of present days or hours / 8
        worked_days = float(len(attendances))
        if worked_days == 0:
            # Fallback to standard working days (22 days) if not recorded
            worked_days = 22.0

        # 2. Unpaid leaves calculation
        unpaid_requests = await TimeOffRequest.find(
            TimeOffRequest.employee_id == slip.employee_id,
            TimeOffRequest.status == "APPROVED",
            TimeOffRequest.start_date <= payrun.period_end,
            TimeOffRequest.end_date >= payrun.period_start
        ).to_list()

        unpaid_days = 0.0
        for ur in unpaid_requests:
            type_obj = await ur.get_link("time_off_type_id") if hasattr(ur, "get_link") else None
            # Or fetch directly
            from app.models.models import TimeOffType
            tot = await TimeOffType.get(ur.time_off_type_id)
            if tot and not tot.is_paid:
                unpaid_days += ur.duration_units

        # 3. Dynamic AST Rule Evaluation
        lines, basic, gross, deductions, net = evaluate_salary_rules(
            contract_wage=contract.wage,
            worked_days=worked_days,
            unpaid_days=unpaid_days,
            total_working_days=22.0,
            rules=rules
        )

        # 4. Pre-Validation Warnings Audit
        warnings = []
        if not emp.bank_details or not emp.bank_details.account_number:
            warnings.append("Missing bank account number")
        if not emp.bank_details or not emp.bank_details.pan_or_tax_id:
            warnings.append("Missing PAN / Tax ID")
        if len(attendances) == 0:
            warnings.append("Zero attendance entries recorded for period")
        if contract.end_date and contract.end_date <= payrun.period_end:
            warnings.append(f"Contract expires on {contract.end_date.strftime('%Y-%m-%d')}")
        if deductions > gross:
            warnings.append("Warning: Deductions exceed gross earnings")

        slip.worked_days = worked_days
        slip.unpaid_leave_days = unpaid_days
        slip.basic_salary = basic
        slip.gross_salary = gross
        slip.total_deductions = deductions
        slip.net_salary = net
        slip.lines = lines
        slip.warnings = warnings
        slip.status = "COMPUTED"
        await slip.save()

        tot_gross += gross
        tot_ded += deductions
        tot_net += net

    payrun.total_gross = round(tot_gross, 2)
    payrun.total_deductions = round(tot_ded, 2)
    payrun.total_net = round(tot_net, 2)
    payrun.status = PayrunStatus.COMPUTED
    await payrun.save()

    return {
        "message": f"Successfully computed {len(payslips)} payslips",
        "total_gross": payrun.total_gross,
        "total_deductions": payrun.total_deductions,
        "total_net": payrun.total_net,
        "status": "COMPUTED"
    }

@router.post("/{id}/validate")
async def validate_payrun(id: str):
    payrun = await Payrun.get(id)
    if not payrun:
        raise HTTPException(status_code=404, detail="Payrun not found")

    payrun.status = PayrunStatus.VALIDATED
    await payrun.save()

    await Payslip.find(Payslip.payrun_id == id).update({"$set": {"status": "VALIDATED"}})
    return {"id": id, "status": "VALIDATED", "message": "Payrun validated and locked"}

@router.post("/{id}/mark-paid")
async def mark_payrun_paid(id: str):
    payrun = await Payrun.get(id)
    if not payrun:
        raise HTTPException(status_code=404, detail="Payrun not found")

    payrun.status = PayrunStatus.PAID
    await payrun.save()

    await Payslip.find(Payslip.payrun_id == id).update({"$set": {"status": "PAID"}})
    return {"id": id, "status": "PAID", "message": "Payrun marked as PAID"}

@router.post("/{id}/send-emails")
async def send_payslips_email(id: str, background_tasks: BackgroundTasks):
    payrun = await Payrun.get(id)
    if not payrun:
        raise HTTPException(status_code=404, detail="Payrun not found")

    payslips = await Payslip.find(Payslip.payrun_id == id).to_list()
    # In hackathon demo, simulate async background email dispatch
    return {
        "message": f"Bulk email dispatch initiated in background for {len(payslips)} employees.",
        "recipient_count": len(payslips),
        "status": "QUEUED"
    }
