from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr
from app.models.models import (
    User, UserRole, Employee, EmployeeStatus, EmploymentType, BankDetails,
    Contract, ContractStatus, TimeOffAllocation, TimeOffType, WorkingSchedule,
    SalaryStructure, Department, JobPosition
)
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.EMPLOYEE
    department_id: Optional[str] = None
    job_title: Optional[str] = None
    phone: Optional[str] = ""

class SwitchUserRequest(BaseModel):
    role: UserRole

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    role: UserRole
    employee_id: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None

@router.get("/public-stats")
async def get_public_stats():
    active_count = await Employee.find(Employee.status == EmployeeStatus.ACTIVE).count()
    return {
        "active_employees_count": active_count,
        "formatted_badge": f"{active_count} Active Employees" if active_count < 1000 else f"{active_count:,}+ Active Employees",
        "status": "ONLINE"
    }

@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    user = await User.find_one(User.email == req.email.lower())
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    token = create_access_token(subject=str(user.id), role=user.role.value, employee_id=user.employee_id)
    
    first_name, last_name = "", ""
    if user.employee_id:
        emp = await Employee.get(user.employee_id)
        if emp:
            first_name, last_name = emp.first_name, emp.last_name

    return AuthResponse(
        access_token=token,
        user_id=str(user.id),
        email=user.email,
        role=user.role,
        employee_id=user.employee_id,
        first_name=first_name,
        last_name=last_name
    )

@router.get("/options")
async def get_registration_options():
    """
    Returns public metadata (departments and roles) for the registration page.
    """
    depts = await Department.find_all().to_list()
    return {
        "departments": [{"id": str(d.id), "name": d.name, "code": d.code} for d in depts],
        "roles": [
            {
                "role": UserRole.EMPLOYEE.value,
                "label": "Employee (Self-Service)",
                "description": "Personal portal for payslips, attendance clock-in/out, and leave requests",
                "badge": "Staff",
                "color": "emerald"
            },
            {
                "role": UserRole.HR_MANAGER.value,
                "label": "HR Manager",
                "description": "Employee master directory, department management, and time-off approvals",
                "badge": "HR Lead",
                "color": "blue"
            },
            {
                "role": UserRole.HR_PAYROLL_MANAGER.value,
                "label": "Payroll Manager",
                "description": "Full payroll processing, salary rule configuration, validation and payment execution",
                "badge": "Finance Lead",
                "color": "purple"
            },
            {
                "role": UserRole.HR_PAYROLL_USER.value,
                "label": "Payroll Officer",
                "description": "Compute payroll runs and review payslips with read-only rule configuration",
                "badge": "Payroll Ops",
                "color": "amber"
            },
            {
                "role": UserRole.ADMIN.value,
                "label": "System Administrator",
                "description": "Unrestricted administrative access to all modules, master records, and configurations",
                "badge": "Super Admin",
                "color": "slate"
            }
        ]
    }

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(req: RegisterRequest):
    """
    Registers a new user with a dedicated persona.
    Auto-provisions a linked Employee record, running Contract, and initial Time Off Allocations
    to guarantee strict data isolation between accounts (zero conflict).
    """
    clean_email = req.email.lower().strip()

    # 1. Verify email uniqueness across users and employees
    existing_user = await User.find_one(User.email == clean_email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please sign in."
        )

    existing_emp = await Employee.find_one(Employee.email == clean_email)
    if existing_emp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An employee profile with this email address already exists."
        )

    # 2. Generate Next Available Unique Employee Code
    all_emps = await Employee.find_all().to_list()
    existing_codes = set(e.employee_code for e in all_emps if e.employee_code)
    code_num = len(all_emps) + 1
    while f"EMP{code_num:03d}" in existing_codes:
        code_num += 1
    employee_code = f"EMP{code_num:03d}"

    # 3. Department Resolution
    dept = None
    if req.department_id:
        dept = await Department.get(req.department_id)
    if not dept:
        dept = await Department.find_one(Department.code == "ENG")
        if not dept:
            dept = await Department.find_one()
        if not dept:
            dept = Department(name="Engineering & Tech", code="ENG")
            await dept.insert()

    # 4. Job Title / Position Resolution
    job_title = req.job_title.strip() if req.job_title else None
    if not job_title:
        role_default_titles = {
            UserRole.ADMIN: "Lead Systems Administrator",
            UserRole.HR_MANAGER: "Talent & People Ops Specialist",
            UserRole.HR_PAYROLL_MANAGER: "Senior Payroll Manager",
            UserRole.HR_PAYROLL_USER: "Payroll Specialist",
            UserRole.EMPLOYEE: "Associate Professional",
        }
        job_title = role_default_titles.get(req.role, "Staff Member")

    pos = await JobPosition.find_one(JobPosition.title == job_title)
    if not pos:
        pos = JobPosition(title=job_title, department_id=str(dept.id))
        await pos.insert()

    # 5. Working Schedule
    schedule = await WorkingSchedule.find_one()

    # 6. Role-Based Starting Base Wage
    role_wages = {
        UserRole.ADMIN: 130000.0,
        UserRole.HR_PAYROLL_MANAGER: 110000.0,
        UserRole.HR_MANAGER: 95000.0,
        UserRole.HR_PAYROLL_USER: 80000.0,
        UserRole.EMPLOYEE: 65000.0,
    }
    wage = role_wages.get(req.role, 65000.0)

    # Provision standard bank details to avoid payrun pre-validation flags
    bank_details = BankDetails(
        bank_name="HDFC Bank Ltd",
        account_number=f"50100{code_num:07d}",
        ifsc_or_swift="HDFC0001234",
        pan_or_tax_id=f"ABCDE{code_num:04d}F"
    )

    # 7. Create Dedicated Employee Record
    first_name = req.first_name.strip()
    last_name = req.last_name.strip()
    avatar_url = f"https://ui-avatars.com/api/?name={first_name}+{last_name}&background=714B67&color=fff&bold=true"

    emp = Employee(
        employee_code=employee_code,
        first_name=first_name,
        last_name=last_name,
        email=clean_email,
        phone=req.phone or f"+91 98765 {code_num:05d}",
        avatar_url=avatar_url,
        status=EmployeeStatus.ACTIVE,
        employment_type=EmploymentType.FULL_TIME,
        department_id=str(dept.id),
        job_position_id=str(pos.id),
        working_schedule_id=str(schedule.id) if schedule else None,
        bank_details=bank_details,
    )
    await emp.insert()

    # 8. Create Running Contract for this Employee
    salary_struct = await SalaryStructure.find_one(SalaryStructure.code == "REG_SAL")
    if not salary_struct:
        salary_struct = await SalaryStructure.find_one()

    struct_id = str(salary_struct.id) if salary_struct else ""
    contract_code = f"CON-2026-{employee_code[3:]}"
    existing_con = await Contract.find_one(Contract.contract_code == contract_code)
    if existing_con:
        contract_code = f"CON-2026-{employee_code[3:]}-{int(datetime.utcnow().timestamp()) % 1000}"

    contract = Contract(
        contract_code=contract_code,
        employee_id=str(emp.id),
        department_id=str(dept.id),
        job_position_id=str(pos.id),
        start_date=datetime(datetime.utcnow().year, 1, 1),
        status=ContractStatus.RUNNING,
        wage=wage,
        salary_structure_id=struct_id,
        working_schedule_id=str(schedule.id) if schedule else None
    )
    await contract.insert()

    # 9. Provision Initial Time Off Allocations
    tot_pto = await TimeOffType.find_one(TimeOffType.code == "PTO")
    tot_sick = await TimeOffType.find_one(TimeOffType.code == "SICK")
    valid_from = datetime(datetime.utcnow().year, 1, 1)
    valid_to = datetime(datetime.utcnow().year, 12, 31)

    if tot_pto:
        await TimeOffAllocation(
            employee_id=str(emp.id),
            time_off_type_id=str(tot_pto.id),
            allocated_units=20.0,
            taken_units=0.0,
            remaining_units=20.0,
            valid_from=valid_from,
            valid_to=valid_to,
            status="APPROVED"
        ).insert()

    if tot_sick:
        await TimeOffAllocation(
            employee_id=str(emp.id),
            time_off_type_id=str(tot_sick.id),
            allocated_units=10.0,
            taken_units=0.0,
            remaining_units=10.0,
            valid_from=valid_from,
            valid_to=valid_to,
            status="APPROVED"
        ).insert()

    # 10. Create User Record Linked to Employee
    new_user = User(
        email=clean_email,
        password_hash=get_password_hash(req.password),
        role=req.role,
        employee_id=str(emp.id)
    )
    await new_user.insert()

    # 11. Generate JWT Access Token
    token = create_access_token(
        subject=str(new_user.id),
        role=new_user.role.value,
        employee_id=new_user.employee_id
    )

    return AuthResponse(
        access_token=token,
        user_id=str(new_user.id),
        email=new_user.email,
        role=new_user.role,
        employee_id=new_user.employee_id,
        first_name=emp.first_name,
        last_name=emp.last_name
    )

@router.post("/demo-switch-user", response_model=AuthResponse)
async def demo_switch_user(req: SwitchUserRequest):
    """
    Hackathon helper endpoint: Seamlessly switches active persona
    (Admin, HR Manager, HR Payroll User, HR Payroll Manager, Employee)
    for instant presentation transitions.
    """
    user = await User.find_one(User.role == req.role)
    if not user:
        raise HTTPException(status_code=404, detail=f"No demo user found with role {req.role}")
    
    token = create_access_token(subject=str(user.id), role=user.role.value, employee_id=user.employee_id)
    
    first_name, last_name = "", ""
    if user.employee_id:
        emp = await Employee.get(user.employee_id)
        if emp:
            first_name, last_name = emp.first_name, emp.last_name

    return AuthResponse(
        access_token=token,
        user_id=str(user.id),
        email=user.email,
        role=user.role,
        employee_id=user.employee_id,
        first_name=first_name,
        last_name=last_name
    )

from app.api.deps import get_current_user

@router.get("/me")
async def get_my_profile(current_user: User = Depends(get_current_user)):
    emp = await Employee.get(current_user.employee_id) if current_user.employee_id else None
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "role": current_user.role,
        "employee_id": current_user.employee_id,
        "first_name": emp.first_name if emp else "",
        "last_name": emp.last_name if emp else ""
    }

