import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings
from app.models.models import (
    User,
    Department,
    JobPosition,
    WorkingSchedule,
    Employee,
    Contract,
    Attendance,
    TimeOffType,
    TimeOffAllocation,
    TimeOffRequest,
    SalaryStructure,
    SalaryRule,
    Payrun,
    Payslip
)

async def init_db():
    client = AsyncIOMotorClient(settings.MONGODB_URL, tlsCAFile=certifi.where())
    database = client[settings.DATABASE_NAME]
    
    await init_beanie(
        database=database,
        document_models=[
            User,
            Department,
            JobPosition,
            WorkingSchedule,
            Employee,
            Contract,
            Attendance,
            TimeOffType,
            TimeOffAllocation,
            TimeOffRequest,
            SalaryStructure,
            SalaryRule,
            Payrun,
            Payslip
        ]
    )
    print("Database & Beanie initialized successfully with MongoDB Atlas!")
