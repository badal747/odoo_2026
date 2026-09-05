from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from app.api.deps import require_roles, get_current_user
from app.models.models import Attendance, AttendanceStatus, Employee, User, UserRole

router = APIRouter(prefix="/attendance", tags=["Attendance Tracking"])

class CheckInRequest(BaseModel):
    employee_id: str

class CheckOutRequest(BaseModel):
    employee_id: str

class ManualCorrectionRequest(BaseModel):
    check_in: datetime
    check_out: Optional[datetime] = None
    status: AttendanceStatus
    manual_edit_note: str
    edited_by_user_id: Optional[str] = "admin"

@router.get("")
async def list_attendances(
    employee_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = {}
    # If Employee role, restrict strictly to their own attendance
    if current_user.role == UserRole.EMPLOYEE:
        if not current_user.employee_id:
            return []
        query["employee_id"] = current_user.employee_id
    elif employee_id:
        query["employee_id"] = employee_id

    if start_date and end_date:
        s = datetime.fromisoformat(start_date)
        e = datetime.fromisoformat(end_date)
        query["date"] = {"$gte": s, "$lte": e}

    import asyncio
    attendances, employees = await asyncio.gather(
        Attendance.find(query).sort("-date").to_list(),
        Employee.find_all().to_list()
    )
    emp_map = {str(e.id): f"{e.first_name} {e.last_name}" for e in employees}

    res = []
    for a in attendances:
        d = a.dict()
        d["id"] = str(a.id)
        d["employee_name"] = emp_map.get(a.employee_id, "Unknown")
        res.append(d)
    return res

@router.post("/check-in")
async def check_in(req: CheckInRequest, current_user: User = Depends(get_current_user)):
    emp_id = req.employee_id
    if current_user.role == UserRole.EMPLOYEE:
        if not current_user.employee_id:
            raise HTTPException(status_code=400, detail="User has no linked employee profile")
        emp_id = current_user.employee_id

    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)

    # Check if already checked in today
    existing = await Attendance.find_one(
        Attendance.employee_id == emp_id,
        Attendance.date == today_start
    )
    if existing:
        raise HTTPException(status_code=400, detail="Already checked in for today")

    # Evaluate late status (Schedule default starts at 09:00, grace period until 09:15)
    # Using local hour/minute comparison
    is_late = (now.hour > 9) or (now.hour == 9 and now.minute > 15)
    status = AttendanceStatus.LATE if is_late else AttendanceStatus.PRESENT

    record = Attendance(
        employee_id=emp_id,
        date=today_start,
        check_in=now,
        status=status,
        worked_hours=0.0
    )
    await record.insert()
    return {"id": str(record.id), "status": status, "check_in": now.isoformat()}

@router.post("/check-out")
async def check_out(req: CheckOutRequest, current_user: User = Depends(get_current_user)):
    emp_id = req.employee_id
    if current_user.role == UserRole.EMPLOYEE:
        if not current_user.employee_id:
            raise HTTPException(status_code=400, detail="User has no linked employee profile")
        emp_id = current_user.employee_id

    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)

    record = await Attendance.find_one(
        Attendance.employee_id == emp_id,
        Attendance.date == today_start
    )
    if not record:
        raise HTTPException(status_code=400, detail="No check-in record found for today")
    if record.check_out:
        raise HTTPException(status_code=400, detail="Already checked out for today")

    record.check_out = now
    delta_seconds = (record.check_out - record.check_in).total_seconds()
    worked_hours = round(max(0.0, delta_seconds / 3600.0), 2)
    record.worked_hours = worked_hours

    # Exception evaluations
    if worked_hours < 4.0:
        record.status = AttendanceStatus.HALF_DAY
    elif worked_hours >= 9.0:
        record.status = AttendanceStatus.OVERTIME

    await record.save()
    return {
        "id": str(record.id),
        "check_out": now.isoformat(),
        "worked_hours": worked_hours,
        "status": record.status
    }

@router.put("/{id}/manual-correction", dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.HR_PAYROLL_MANAGER))])
async def manual_correction(id: str, req: ManualCorrectionRequest, current_user: User = Depends(get_current_user)):
    record = await Attendance.get(id)
    if not record:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    if not req.manual_edit_note or len(req.manual_edit_note.strip()) < 5:
        raise HTTPException(status_code=400, detail="A valid audit note explaining the manual edit is mandatory")

    record.check_in = req.check_in
    record.check_out = req.check_out
    if req.check_out:
        delta = (req.check_out - req.check_in).total_seconds()
        record.worked_hours = round(max(0.0, delta / 3600.0), 2)
    record.status = req.status
    record.is_manual_edit = True
    record.manual_edit_note = req.manual_edit_note
    record.edited_by_user_id = str(current_user.id)
    await record.save()

    return {"id": str(record.id), "message": "Attendance corrected with audit trail"}
