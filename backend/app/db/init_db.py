import certifi
import dns.resolver
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings

# Ensure fast and reliable DNS resolution for MongoDB Atlas SRV connection on Windows
try:
    dns.resolver.default_resolver = dns.resolver.Resolver(configure=False)
    dns.resolver.default_resolver.nameservers = ['8.8.8.8', '1.1.1.1', '8.8.4.4']
except Exception:
    pass
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
