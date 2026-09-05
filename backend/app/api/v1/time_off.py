from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.models.models import (
    TimeOffType, TimeOffAllocation, TimeOffRequest,
    TimeOffRequestStatus, Employee, LeaveUnit
)

router = APIRouter(prefix="/time-off", tags=["Time Off & Leaves"])

class TypeCreate(BaseModel):
    name: str
    code: str
    unit: LeaveUnit = LeaveUnit.DAYS
    requires_allocation: bool = True
    is_paid: bool = True
    color_code: str = "#3B82F6"

class AllocationCreate(BaseModel):
    employee_id: str
    time_off_type_id: str
    allocated_units: float
    valid_from: datetime
    valid_to: datetime

class RequestCreate(BaseModel):
    employee_id: str
    time_off_type_id: str
    start_date: datetime
    end_date: datetime
    duration_units: float
    reason: Optional[str] = ""

class RefusalRequest(BaseModel):
    refusal_reason: str

# ----------------- TIME OFF TYPES -----------------
@router.get("/types")
async def list_types():
    types = await TimeOffType.find_all().to_list()
    return [{"id": str(t.id), **t.dict()} for t in types]

@router.post("/types")
async def create_type(req: TypeCreate):
    existing = await TimeOffType.find_one(TimeOffType.code == req.code)
    if existing:
        raise HTTPException(status_code=400, detail="Time off type code already exists")
    t = TimeOffType(**req.dict())
    await t.insert()
    return {"id": str(t.id), "name": t.name}

# ----------------- ALLOCATIONS -----------------
@router.get("/allocations")
async def list_allocations(employee_id: Optional[str] = None):
    query = {}
    if employee_id:
        query["employee_id"] = employee_id

    allocations = await TimeOffAllocation.find(query).to_list()
    emp_map = {str(e.id): f"{e.first_name} {e.last_name}" for e in await Employee.find_all().to_list()}
    type_map = {str(t.id): t.name for t in await TimeOffType.find_all().to_list()}

    res = []
    for a in allocations:
        d = a.dict()
        d["id"] = str(a.id)
        d["employee_name"] = emp_map.get(a.employee_id, "Unknown")
        d["time_off_type_name"] = type_map.get(a.time_off_type_id, "Unknown")
        res.append(d)
    return res

@router.post("/allocations")
async def create_allocation(req: AllocationCreate):
    alloc = TimeOffAllocation(
        employee_id=req.employee_id,
        time_off_type_id=req.time_off_type_id,
        allocated_units=req.allocated_units,
        taken_units=0.0,
        remaining_units=req.allocated_units,
        valid_from=req.valid_from,
        valid_to=req.valid_to,
        status="APPROVED"
    )
    await alloc.insert()
    return {"id": str(alloc.id), "remaining_units": alloc.remaining_units}

# ----------------- TIME OFF REQUESTS -----------------
@router.get("/requests")
async def list_requests(employee_id: Optional[str] = None, status: Optional[str] = None):
    query = {}
    if employee_id:
        query["employee_id"] = employee_id
    if status:
        query["status"] = status

    requests = await TimeOffRequest.find(query).sort("-created_at").to_list()
    emp_map = {str(e.id): f"{e.first_name} {e.last_name}" for e in await Employee.find_all().to_list()}
    type_map = {str(t.id): {"name": t.name, "is_paid": t.is_paid, "color": t.color_code} for t in await TimeOffType.find_all().to_list()}

    res = []
    for r in requests:
        d = r.dict()
        d["id"] = str(r.id)
        d["employee_name"] = emp_map.get(r.employee_id, "Unknown")
        type_info = type_map.get(r.time_off_type_id, {"name": "Unknown", "is_paid": True, "color": "#3B82F6"})
        d["time_off_type_name"] = type_info["name"]
        d["is_paid"] = type_info["is_paid"]
        d["color_code"] = type_info["color"]
        res.append(d)
    return res

@router.post("/requests")
async def create_request(req: RequestCreate):
    leave_type = await TimeOffType.get(req.time_off_type_id)
    if not leave_type:
        raise HTTPException(status_code=404, detail="Leave type not found")

    # If leave requires allocation balance, check sufficiency
    if leave_type.requires_allocation:
        allocations = await TimeOffAllocation.find(
            TimeOffAllocation.employee_id == req.employee_id,
            TimeOffAllocation.time_off_type_id == req.time_off_type_id,
            TimeOffAllocation.status == "APPROVED",
            TimeOffAllocation.valid_from <= req.end_date,
            TimeOffAllocation.valid_to >= req.start_date
        ).to_list()

        total_remaining = sum(a.remaining_units for a in allocations)
        if total_remaining < req.duration_units:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient leave balance. You have {total_remaining:.1f} days remaining, but requested {req.duration_units:.1f} days."
            )

    leave_req = TimeOffRequest(**req.dict())
    await leave_req.insert()
    return {"id": str(leave_req.id), "status": leave_req.status, "message": "Time off request submitted"}

@router.put("/requests/{id}/approve")
async def approve_request(id: str, approved_by: Optional[str] = "admin"):
    leave_req = await TimeOffRequest.get(id)
    if not leave_req:
        raise HTTPException(status_code=404, detail="Request not found")
    if leave_req.status == TimeOffRequestStatus.APPROVED:
        return {"message": "Already approved"}

    leave_type = await TimeOffType.get(leave_req.time_off_type_id)
    
    # Atomic deduction from active allocation
    if leave_type and leave_type.requires_allocation:
        alloc = await TimeOffAllocation.find_one(
            TimeOffAllocation.employee_id == leave_req.employee_id,
            TimeOffAllocation.time_off_type_id == leave_req.time_off_type_id,
            TimeOffAllocation.status == "APPROVED",
            TimeOffAllocation.remaining_units >= leave_req.duration_units
        )
        if not alloc:
            raise HTTPException(status_code=400, detail="Cannot approve: Insufficient allocation balance remaining")

        alloc.taken_units = round(alloc.taken_units + leave_req.duration_units, 2)
        alloc.remaining_units = round(alloc.allocated_units - alloc.taken_units, 2)
        await alloc.save()

    leave_req.status = TimeOffRequestStatus.APPROVED
    leave_req.approved_by = approved_by
    await leave_req.save()

    return {"id": str(leave_req.id), "status": "APPROVED", "message": "Leave approved and balance deducted"}

@router.put("/requests/{id}/refuse")
async def refuse_request(id: str, req: RefusalRequest, refused_by: Optional[str] = "admin"):
    leave_req = await TimeOffRequest.get(id)
    if not leave_req:
        raise HTTPException(status_code=404, detail="Request not found")

    leave_req.status = TimeOffRequestStatus.REFUSED
    leave_req.refusal_reason = req.refusal_reason
    leave_req.approved_by = refused_by
    await leave_req.save()
    return {"id": str(leave_req.id), "status": "REFUSED", "message": "Leave refused"}
