from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.models.models import Contract, ContractStatus, Employee, Department, JobPosition, SalaryStructure

router = APIRouter(prefix="/contracts", tags=["Contract Management"])

class ContractCreate(BaseModel):
    contract_code: str
    employee_id: str
    department_id: str
    job_position_id: str
    start_date: datetime
    end_date: Optional[datetime] = None
    status: ContractStatus = ContractStatus.DRAFT
    wage: float
    salary_structure_id: str
    working_schedule_id: Optional[str] = None

@router.get("")
async def list_contracts(employee_id: Optional[str] = None, status: Optional[str] = None):
    query = {}
    if employee_id:
        query["employee_id"] = employee_id
    if status:
        query["status"] = status

    contracts = await Contract.find(query).to_list()
    
    emp_map = {str(e.id): f"{e.first_name} {e.last_name}" for e in await Employee.find_all().to_list()}
    dept_map = {str(d.id): d.name for d in await Department.find_all().to_list()}
    struct_map = {str(s.id): s.name for s in await SalaryStructure.find_all().to_list()}

    res = []
    for c in contracts:
        d = c.dict()
        d["id"] = str(c.id)
        d["employee_name"] = emp_map.get(c.employee_id, "Unknown")
        d["department_name"] = dept_map.get(c.department_id, "Unknown")
        d["salary_structure_name"] = struct_map.get(c.salary_structure_id, "Unknown")
        res.append(d)
    return res

@router.get("/{id}")
async def get_contract(id: str):
    contract = await Contract.get(id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    emp = await Employee.get(contract.employee_id)
    dept = await Department.get(contract.department_id)
    struct = await SalaryStructure.get(contract.salary_structure_id)

    d = contract.dict()
    d["id"] = str(contract.id)
    d["employee_name"] = f"{emp.first_name} {emp.last_name}" if emp else "Unknown"
    d["department_name"] = dept.name if dept else "Unknown"
    d["salary_structure_name"] = struct.name if struct else "Unknown"
    return d

@router.post("")
async def create_contract(req: ContractCreate):
    # 1. Code uniqueness check
    existing = await Contract.find_one(Contract.contract_code == req.contract_code)
    if existing:
        raise HTTPException(status_code=400, detail="Contract code already exists")

    # 2. Concurrency check: If status is RUNNING, ensure NO overlapping active contract for same employee
    if req.status == ContractStatus.RUNNING:
        running_contracts = await Contract.find(
            Contract.employee_id == req.employee_id,
            Contract.status == ContractStatus.RUNNING
        ).to_list()

        for rc in running_contracts:
            # Overlap check
            c_start = req.start_date
            c_end = req.end_date or datetime(2099, 12, 31)
            rc_start = rc.start_date
            rc_end = rc.end_date or datetime(2099, 12, 31)

            if not (c_end < rc_start or c_start > rc_end):
                raise HTTPException(
                    status_code=400,
                    detail=f"Temporal Conflict: Employee already has an active contract '{rc.contract_code}' overlapping this period. Please expire or modify the previous contract first."
                )

    c = Contract(**req.dict())
    await c.insert()
    return {"id": str(c.id), "contract_code": c.contract_code, "message": "Contract created successfully"}

@router.put("/{id}")
async def update_contract(id: str, req: ContractCreate):
    contract = await Contract.get(id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    # Concurrency check if changing to RUNNING
    if req.status == ContractStatus.RUNNING:
        other_running = await Contract.find(
            Contract.employee_id == req.employee_id,
            Contract.status == ContractStatus.RUNNING,
            Contract.id != contract.id
        ).to_list()

        for rc in other_running:
            c_start = req.start_date
            c_end = req.end_date or datetime(2099, 12, 31)
            rc_start = rc.start_date
            rc_end = rc.end_date or datetime(2099, 12, 31)
            if not (c_end < rc_start or c_start > rc_end):
                raise HTTPException(
                    status_code=400,
                    detail=f"Temporal Conflict: Overlaps with running contract '{rc.contract_code}'."
                )

    for k, v in req.dict().items():
        setattr(contract, k, v)
    contract.updated_at = datetime.utcnow()
    await contract.save()
    return {"id": str(contract.id), "message": "Contract updated successfully"}
