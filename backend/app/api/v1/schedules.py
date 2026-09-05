from typing import List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.models.models import WorkingSchedule, ScheduleDayPattern

router = APIRouter(prefix="/schedules", tags=["Working Schedules"])

class ScheduleCreate(BaseModel):
    name: str
    schedule_type: str = "STANDARD_40H"
    patterns: List[ScheduleDayPattern]

def compute_hours_from_patterns(patterns: List[ScheduleDayPattern]) -> float:
    total_hours = 0.0
    for p in patterns:
        if not p.is_active:
            p.day_hours = 0.0
            continue
        try:
            start_h, start_m = map(int, p.start_time.split(":"))
            end_h, end_m = map(int, p.end_time.split(":"))
            total_mins = (end_h * 60 + end_m) - (start_h * 60 + start_m) - p.break_duration_mins
            day_h = max(0.0, total_mins / 60.0)
            p.day_hours = round(day_h, 2)
            total_hours += day_h
        except Exception:
            p.day_hours = 0.0
    return round(total_hours, 2)

@router.get("")
async def list_schedules():
    schedules = await WorkingSchedule.find_all().to_list()
    res = []
    for s in schedules:
        d = s.dict()
        d["id"] = str(s.id)
        res.append(d)
    return res

@router.get("/{id}")
async def get_schedule(id: str):
    schedule = await WorkingSchedule.get(id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    d = schedule.dict()
    d["id"] = str(schedule.id)
    return d

@router.post("")
async def create_schedule(req: ScheduleCreate):
    # Auto calculate weekly hours from pattern
    weekly_hours = compute_hours_from_patterns(req.patterns)
    
    schedule = WorkingSchedule(
        name=req.name,
        schedule_type=req.schedule_type,
        weekly_hours=weekly_hours,
        patterns=req.patterns
    )
    await schedule.insert()
    return {"id": str(schedule.id), "weekly_hours": weekly_hours, "name": schedule.name}

@router.put("/{id}")
async def update_schedule(id: str, req: ScheduleCreate):
    schedule = await WorkingSchedule.get(id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    weekly_hours = compute_hours_from_patterns(req.patterns)
    schedule.name = req.name
    schedule.schedule_type = req.schedule_type
    schedule.weekly_hours = weekly_hours
    schedule.patterns = req.patterns
    await schedule.save()
    return {"id": str(schedule.id), "weekly_hours": weekly_hours, "message": "Schedule updated"}
