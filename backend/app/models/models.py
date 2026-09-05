from datetime import datetime, date
from typing import List, Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel, EmailStr, Field
from beanie import Document, Indexed

# ==========================================
# 1. ENUMS
# ==========================================
class UserRole(str, Enum):
    EMPLOYEE = "EMPLOYEE"
    HR_MANAGER = "HR_MANAGER"
    HR_PAYROLL_USER = "HR_PAYROLL_USER"
    HR_PAYROLL_MANAGER = "HR_PAYROLL_MANAGER"
    ADMIN = "ADMIN"

class EmployeeStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    ON_LEAVE = "ON_LEAVE"
    TERMINATED = "TERMINATED"

class EmploymentType(str, Enum):
    FULL_TIME = "FULL_TIME"
    PART_TIME = "PART_TIME"
    CONTRACT = "CONTRACT"
    INTERN = "INTERN"

class ContractStatus(str, Enum):
    DRAFT = "DRAFT"
    RUNNING = "RUNNING"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"

class AttendanceStatus(str, Enum):
    PRESENT = "PRESENT"
    LATE = "LATE"
    EARLY_DEPARTURE = "EARLY_DEPARTURE"
    ABSENT = "ABSENT"
    HALF_DAY = "HALF_DAY"
    OVERTIME = "OVERTIME"

class LeaveUnit(str, Enum):
    DAYS = "DAYS"
    HOURS = "HOURS"

class TimeOffRequestStatus(str, Enum):
    DRAFT = "DRAFT"
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REFUSED = "REFUSED"
    CANCELLED = "CANCELLED"

class RuleCategory(str, Enum):
    BASIC = "BASIC"
    ALLOWANCE = "ALLOWANCE"
    GROSS = "GROSS"
    DEDUCTION = "DEDUCTION"
    COMPANY_CONTRIBUTION = "COMPANY_CONTRIBUTION"
    NET = "NET"

class ComputationType(str, Enum):
    FIXED = "FIXED"
    PERCENTAGE = "PERCENTAGE"
    FORMULA = "FORMULA"

class PayrunStatus(str, Enum):
    DRAFT = "DRAFT"
    COMPUTED = "COMPUTED"
    VALIDATED = "VALIDATED"
    PAID = "PAID"
    CANCELLED = "CANCELLED"

# ==========================================
# 2. EMBEDDED SUB-MODELS
# ==========================================
class ScheduleDayPattern(BaseModel):
    day_of_week: str       # "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"
    is_active: bool = True
    start_time: str = "09:00"
    end_time: str = "18:00"
    break_duration_mins: int = 60
    day_hours: float = 8.0

class BankDetails(BaseModel):
    bank_name: Optional[str] = ""
    account_number: Optional[str] = ""
    ifsc_or_swift: Optional[str] = ""
    pan_or_tax_id: Optional[str] = ""

class PayslipLineEmbedded(BaseModel):
    rule_code: str         # "BASIC", "HRA", "PF", "NET"
    rule_name: str
    category: RuleCategory
    sequence: int
    rate: Optional[float] = None
    amount: float
    calculation_note: Optional[str] = None

# ==========================================
# 3. BEANIE MONGODB DOCUMENTS
# ==========================================
class User(Document):
    email: Indexed(EmailStr, unique=True)
    password_hash: str
    role: UserRole = UserRole.EMPLOYEE
    employee_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"

class Department(Document):
    name: Indexed(str, unique=True)
    code: Indexed(str, unique=True)
    manager_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "departments"

class JobPosition(Document):
    title: Indexed(str, unique=True)
    department_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "job_positions"

class WorkingSchedule(Document):
    name: Indexed(str, unique=True)
    schedule_type: str = "STANDARD_40H"
    weekly_hours: float = 40.0
    patterns: List[ScheduleDayPattern] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "working_schedules"

class Employee(Document):
    employee_code: Indexed(str, unique=True) # "EMP001"
    first_name: str
    last_name: str
    email: Indexed(EmailStr, unique=True)
    phone: Optional[str] = ""
    avatar_url: Optional[str] = ""
    status: EmployeeStatus = EmployeeStatus.ACTIVE
    employment_type: EmploymentType = EmploymentType.FULL_TIME
    
    department_id: str
    job_position_id: str
    manager_id: Optional[str] = None
    working_schedule_id: Optional[str] = None
    bank_details: BankDetails = Field(default_factory=BankDetails)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "employees"

class Contract(Document):
    contract_code: Indexed(str, unique=True) # "CON-2026-001"
    employee_id: Indexed(str)
    department_id: str
    job_position_id: str
    start_date: datetime
    end_date: Optional[datetime] = None
    status: ContractStatus = ContractStatus.DRAFT
    wage: float # Monthly base salary wage
    salary_structure_id: str
    working_schedule_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "contracts"

class Attendance(Document):
    employee_id: Indexed(str)
    date: datetime # Date of attendance (YYYY-MM-DD 00:00:00)
    check_in: datetime
    check_out: Optional[datetime] = None
    worked_hours: float = 0.0
    status: AttendanceStatus = AttendanceStatus.PRESENT
    is_manual_edit: bool = False
    manual_edit_note: Optional[str] = None
    edited_by_user_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "attendances"

class TimeOffType(Document):
    name: Indexed(str, unique=True) # "Paid Time Off", "Sick Leave"
    code: Indexed(str, unique=True) # "PTO", "SICK", "UNPAID"
    unit: LeaveUnit = LeaveUnit.DAYS
    requires_allocation: bool = True
    is_paid: bool = True
    color_code: str = "#3B82F6"
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "time_off_types"

class TimeOffAllocation(Document):
    employee_id: Indexed(str)
    time_off_type_id: Indexed(str)
    allocated_units: float # e.g. 20.0
    taken_units: float = 0.0
    remaining_units: float # allocated_units - taken_units
    valid_from: datetime
    valid_to: datetime
    status: str = "APPROVED" # "DRAFT", "APPROVED", "REFUSED"
    approved_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "time_off_allocations"

class TimeOffRequest(Document):
    employee_id: Indexed(str)
    time_off_type_id: Indexed(str)
    start_date: datetime
    end_date: datetime
    duration_units: float
    reason: Optional[str] = ""
    status: TimeOffRequestStatus = TimeOffRequestStatus.PENDING
    approved_by: Optional[str] = None
    refusal_reason: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "time_off_requests"

class SalaryStructure(Document):
    name: Indexed(str, unique=True)
    code: Indexed(str, unique=True)
    description: Optional[str] = ""
    active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "salary_structures"

class SalaryRule(Document):
    structure_id: Indexed(str)
    name: str # "Basic Salary", "House Rent Allowance"
    code: Indexed(str) # "BASIC", "HRA", "GROSS", "PF", "NET"
    category: RuleCategory
    sequence: int # 10, 20, 30, 40...
    computation_type: ComputationType = ComputationType.PERCENTAGE
    fixed_amount: Optional[float] = 0.0
    percentage: Optional[float] = 0.0
    percentage_base_code: Optional[str] = None
    formula_expression: Optional[str] = None
    active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "salary_rules"

class Payrun(Document):
    name: str # "March 2026 Regular Payroll"
    period_start: datetime
    period_end: datetime
    salary_structure_id: str
    status: PayrunStatus = PayrunStatus.DRAFT
    selected_employee_ids: List[str] = []
    
    total_employees: int = 0
    total_gross: float = 0.0
    total_deductions: float = 0.0
    total_net: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "payruns"

class Payslip(Document):
    payslip_number: Indexed(str, unique=True) # "SLIP/2026/03/001"
    payrun_id: Indexed(str)
    employee_id: Indexed(str)
    contract_id: str
    period_start: datetime
    period_end: datetime
    status: str = "DRAFT" # "DRAFT", "COMPUTED", "VALIDATED", "PAID"
    
    worked_days: float = 0.0
    unpaid_leave_days: float = 0.0
    
    basic_salary: float = 0.0
    gross_salary: float = 0.0
    total_deductions: float = 0.0
    net_salary: float = 0.0
    
    warnings: List[str] = []
    lines: List[PayslipLineEmbedded] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "payslips"
