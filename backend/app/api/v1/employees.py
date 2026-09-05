from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, EmailStr
from app.api.deps import require_roles, get_current_user
from app.models.models import (
    Employee, Department, JobPosition, Contract, Attendance,
    TimeOffAllocation, TimeOffRequest, EmployeeStatus, EmploymentType, BankDetails,
    UserRole
)

router = APIRouter(prefix="/employees", tags=["Employee Master"])

class EmployeeCreate(BaseModel):
    employee_code: str
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = ""
    avatar_url: Optional[str] = ""
    status: EmployeeStatus = EmployeeStatus.ACTIVE
    employment_type: EmploymentType = EmploymentType.FULL_TIME
    department_id: str
    job_position_id: str
    manager_id: Optional[str] = None
    working_schedule_id: Optional[str] = None
    bank_details: Optional[BankDetails] = None

class DepartmentCreate(BaseModel):
    name: str
    code: str

class PositionCreate(BaseModel):
    title: str
    department_id: Optional[str] = None

# ----------------- EMPLOYEES -----------------
@router.get("", dependencies=[Depends(get_current_user)])
async def list_employees(
    department_id: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None
):
    query = {}
    if department_id:
        query["department_id"] = department_id
    if status:
        query["status"] = status
    
    import asyncio
    employees, depts, positions = await asyncio.gather(
        Employee.find(query).to_list(),
        Department.find_all().to_list(),
        JobPosition.find_all().to_list()
    )
    
    # In-memory search filter if provided
    if search:
        s = search.lower()
        employees = [
            e for e in employees
            if s in e.first_name.lower() or s in e.last_name.lower() or s in e.employee_code.lower() or s in e.email.lower()
        ]
        
    # Enrich with department and position titles
    dept_map = {str(d.id): d.name for d in depts}
    pos_map = {str(p.id): p.title for p in positions}
    
    res = []
    for emp in employees:
        d = emp.dict()
        d["id"] = str(emp.id)
        d["department_name"] = dept_map.get(emp.department_id, "Unknown")
        d["job_position_title"] = pos_map.get(emp.job_position_id, "Unknown")
        res.append(d)
        
    return res

@router.get("/{id}", dependencies=[Depends(get_current_user)])
async def get_employee(id: str):
    emp = await Employee.get(id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    dept = await Department.get(emp.department_id) if emp.department_id else None
    pos = await JobPosition.get(emp.job_position_id) if emp.job_position_id else None
    mgr = await Employee.get(emp.manager_id) if emp.manager_id else None
    
    d = emp.dict()
    d["id"] = str(emp.id)
    d["department_name"] = dept.name if dept else "N/A"
    d["job_position_title"] = pos.title if pos else "N/A"
    d["manager_name"] = f"{mgr.first_name} {mgr.last_name}" if mgr else "None (Top Level)"
    return d

@router.post("", dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.HR_PAYROLL_MANAGER))])
async def create_employee(req: EmployeeCreate):
    existing = await Employee.find_one(Employee.employee_code == req.employee_code)
    if existing:
        raise HTTPException(status_code=400, detail="Employee code already exists")
    
    emp = Employee(**req.dict())
    await emp.insert()
    return {"id": str(emp.id), "message": "Employee created successfully"}

@router.put("/{id}", dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.HR_PAYROLL_MANAGER))])
async def update_employee(id: str, req: EmployeeCreate):
    emp = await Employee.get(id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    for k, v in req.dict().items():
        setattr(emp, k, v)
    emp.updated_at = datetime.utcnow()
    await emp.save()
    return {"id": str(emp.id), "message": "Employee updated successfully"}

class QuickBankUpdate(BaseModel):
    bank_name: str
    account_number: str
    pan_or_tax_id: str

@router.patch("/{id}/bank-details", dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.HR_PAYROLL_MANAGER))])
async def update_employee_bank_details(id: str, req: QuickBankUpdate):
    emp = await Employee.get(id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    emp.bank_details = BankDetails(
        bank_name=req.bank_name,
        account_number=req.account_number,
        pan_or_tax_id=req.pan_or_tax_id
    )
    emp.updated_at = datetime.utcnow()
    await emp.save()
    return {"id": str(emp.id), "message": "Bank details updated successfully"}

@router.get("/{id}/smart-counts", dependencies=[Depends(get_current_user)])
async def get_employee_smart_counts(id: str):
    """
    Returns live counters for Smart Buttons on Employee Form:
    - Contracts Count & Active Contract ID
    - Attendance Count (current month)
    - Time Off Count (approved requests)
    - Allocations Remaining Balance
    """
    emp = await Employee.get(id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    contracts = await Contract.find(Contract.employee_id == id).to_list()
    active_contract = next((c for c in contracts if c.status == "RUNNING"), None)

    # Attendance count (this month)
    now = datetime.utcnow()
    first_of_month = datetime(now.year, now.month, 1)
    attendances = await Attendance.find(
        Attendance.employee_id == id,
        Attendance.date >= first_of_month
    ).to_list()

    # Approved time off requests count
    approved_leaves = await TimeOffRequest.find(
        TimeOffRequest.employee_id == id,
        TimeOffRequest.status == "APPROVED"
    ).to_list()

    # Remaining allocations balance
    allocations = await TimeOffAllocation.find(
        TimeOffAllocation.employee_id == id,
        TimeOffAllocation.status == "APPROVED"
    ).to_list()
    total_remaining_balance = sum(a.remaining_units for a in allocations)

    return {
        "employee_id": id,
        "contracts_count": len(contracts),
        "active_contract_id": str(active_contract.id) if active_contract else None,
        "active_contract_wage": active_contract.wage if active_contract else 0.0,
        "attendance_count": len(attendances),
        "approved_leaves_count": len(approved_leaves),
        "leave_balance_remaining": total_remaining_balance
    }

# ----------------- DEPARTMENTS & POSITIONS -----------------
@router.get("/departments/all", dependencies=[Depends(get_current_user)])
async def list_departments():
    depts = await Department.find_all().to_list()
    res = []
    for d in depts:
        count = await Employee.find(Employee.department_id == str(d.id)).count()
        res.append({
            "id": str(d.id),
            "name": d.name,
            "code": d.code,
            "employee_count": count
        })
    return res

@router.post("/departments", dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.HR_PAYROLL_MANAGER))])
async def create_department(req: DepartmentCreate):
    dept = Department(name=req.name, code=req.code)
    await dept.insert()
    return {"id": str(dept.id), "name": dept.name}

@router.get("/positions/all", dependencies=[Depends(get_current_user)])
async def list_positions():
    positions = await JobPosition.find_all().to_list()
    return [{"id": str(p.id), "title": p.title, "department_id": p.department_id} for p in positions]

@router.post("/positions", dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.HR_PAYROLL_MANAGER))])
async def create_position(req: PositionCreate):
    pos = JobPosition(title=req.title, department_id=req.department_id)
    await pos.insert()
    return {"id": str(pos.id), "title": pos.title}
