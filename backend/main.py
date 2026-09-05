from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.db.init_db import init_db
from app.api.v1.auth import router as auth_router
from app.api.v1.employees import router as employees_router
from app.api.v1.contracts import router as contracts_router
from app.api.v1.schedules import router as schedules_router
from app.api.v1.attendance import router as attendance_router
from app.api.v1.time_off import router as time_off_router
from app.api.v1.salary_config import router as salary_config_router
from app.api.v1.payruns import router as payruns_router
from app.api.v1.payslips import router as payslips_router
from app.api.v1.dashboard import router as dashboard_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Beanie & MongoDB on startup
    await init_db()
    yield

app = FastAPI(
    title="PeoplePay360 HR & Payroll API",
    description="Integrated Human Resource and Payroll Operations Platform (Odoo Hackathon)",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development/hackathon allow all or specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers under /api/v1
api_prefix = settings.API_V1_STR
app.include_router(auth_router, prefix=api_prefix)
app.include_router(employees_router, prefix=api_prefix)
app.include_router(contracts_router, prefix=api_prefix)
app.include_router(schedules_router, prefix=api_prefix)
app.include_router(attendance_router, prefix=api_prefix)
app.include_router(time_off_router, prefix=api_prefix)
app.include_router(salary_config_router, prefix=api_prefix)
app.include_router(payruns_router, prefix=api_prefix)
app.include_router(payslips_router, prefix=api_prefix)
app.include_router(dashboard_router, prefix=api_prefix)

@app.get("/")
def root():
    return {
        "platform": "PeoplePay360 HR & Payroll",
        "status": "Online",
        "docs_url": "/docs",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
