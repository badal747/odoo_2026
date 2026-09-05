import asyncio
import os
import certifi
from datetime import datetime, timedelta
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

load_dotenv()

from app.core.config import settings
from app.core.security import get_password_hash
from app.models.models import (
    User, UserRole, Department, JobPosition, WorkingSchedule, ScheduleDayPattern,
    Employee, EmployeeStatus, EmploymentType, BankDetails, Contract, ContractStatus,
    Attendance, AttendanceStatus, TimeOffType, LeaveUnit, TimeOffAllocation,
    TimeOffRequest, TimeOffRequestStatus, SalaryStructure, SalaryRule, RuleCategory,
    ComputationType, Payrun, PayrunStatus, Payslip, PayslipLineEmbedded
)
from app.services.payroll_engine import evaluate_salary_rules

async def seed():
    print("[SEED] Connecting to MongoDB Atlas for Seeding...")
    client = AsyncIOMotorClient(settings.MONGODB_URL, tlsCAFile=certifi.where())
    database = client[settings.DATABASE_NAME]

    await init_beanie(
        database=database,
        document_models=[
            User, Department, JobPosition, WorkingSchedule, Employee, Contract,
            Attendance, TimeOffType, TimeOffAllocation, TimeOffRequest,
            SalaryStructure, SalaryRule, Payrun, Payslip
        ]
    )

    print("Cleaning existing collections...")
    for model in [User, Department, JobPosition, WorkingSchedule, Employee, Contract,
                  Attendance, TimeOffType, TimeOffAllocation, TimeOffRequest,
                  SalaryStructure, SalaryRule, Payrun, Payslip]:
        await model.delete_all()

    # 1. Departments
    print("Creating Departments...")
    dept_eng = await Department(name="Engineering & Tech", code="ENG").insert()
    dept_hr = await Department(name="Human Resources", code="HR").insert()
    dept_sales = await Department(name="Sales & Revenue", code="SALES").insert()
    dept_mkt = await Department(name="Growth & Marketing", code="MKT").insert()

    # 2. Job Positions
    print("Creating Job Positions...")
    pos_lead = await JobPosition(title="Lead Software Architect", department_id=str(dept_eng.id)).insert()
    pos_dev = await JobPosition(title="Senior Fullstack Engineer", department_id=str(dept_eng.id)).insert()
    pos_hr_mgr = await JobPosition(title="HR Director", department_id=str(dept_hr.id)).insert()
    pos_sales = await JobPosition(title="Enterprise Account Executive", department_id=str(dept_sales.id)).insert()
    pos_mkt = await JobPosition(title="Digital Marketing Specialist", department_id=str(dept_mkt.id)).insert()

    # 3. Working Schedule
    print("Creating Working Schedules...")
    days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]
    patterns_40h = [
        ScheduleDayPattern(day_of_week=d, is_active=True, start_time="09:00", end_time="18:00", break_duration_mins=60, day_hours=8.0)
        for d in days
    ]
    patterns_40h.append(ScheduleDayPattern(day_of_week="SATURDAY", is_active=False, start_time="09:00", end_time="13:00", break_duration_mins=0, day_hours=0.0))
    patterns_40h.append(ScheduleDayPattern(day_of_week="SUNDAY", is_active=False, start_time="09:00", end_time="13:00", break_duration_mins=0, day_hours=0.0))
    
    schedule_std = await WorkingSchedule(
        name="Standard 40 Hours (Mon-Fri)",
        schedule_type="STANDARD_40H",
        weekly_hours=40.0,
        patterns=patterns_40h
    ).insert()

    # 4. Salary Structure & Dynamic Rules
    print("Creating Salary Structure & Dynamic Rules...")
    struct_reg = await SalaryStructure(
        name="Standard Regular Salary",
        code="REG_SAL",
        description="Standard salary structure with Basic, HRA, Conveyance, PF and TDS",
        active=True
    ).insert()

    struct_id = str(struct_reg.id)
    rules_data = [
        SalaryRule(structure_id=struct_id, name="Basic Salary", code="BASIC", category=RuleCategory.BASIC, sequence=10, computation_type=ComputationType.PERCENTAGE, percentage=50.0, percentage_base_code="WAGE"),
        SalaryRule(structure_id=struct_id, name="House Rent Allowance", code="HRA", category=RuleCategory.ALLOWANCE, sequence=20, computation_type=ComputationType.PERCENTAGE, percentage=40.0, percentage_base_code="BASIC"),
        SalaryRule(structure_id=struct_id, name="Conveyance Allowance", code="CONV", category=RuleCategory.ALLOWANCE, sequence=30, computation_type=ComputationType.FIXED, fixed_amount=1600.0),
        SalaryRule(structure_id=struct_id, name="Medical Allowance", code="MED", category=RuleCategory.ALLOWANCE, sequence=40, computation_type=ComputationType.FIXED, fixed_amount=1250.0),
        SalaryRule(structure_id=struct_id, name="Gross Earnings", code="GROSS", category=RuleCategory.GROSS, sequence=100, computation_type=ComputationType.FORMULA, formula_expression="rules['BASIC'] + rules['HRA'] + rules['CONV'] + rules['MED']"),
        SalaryRule(structure_id=struct_id, name="Unpaid Leave Deduction", code="UNPAID_DED", category=RuleCategory.DEDUCTION, sequence=150, computation_type=ComputationType.FORMULA, formula_expression="(rules['GROSS'] / total_days) * unpaid_days"),
        SalaryRule(structure_id=struct_id, name="Provident Fund (PF)", code="PF", category=RuleCategory.DEDUCTION, sequence=200, computation_type=ComputationType.PERCENTAGE, percentage=12.0, percentage_base_code="BASIC"),
        SalaryRule(structure_id=struct_id, name="Professional Tax", code="PT", category=RuleCategory.DEDUCTION, sequence=210, computation_type=ComputationType.FIXED, fixed_amount=200.0),
        SalaryRule(structure_id=struct_id, name="Income Tax (TDS)", code="TDS", category=RuleCategory.DEDUCTION, sequence=220, computation_type=ComputationType.FORMULA, formula_expression="((rules['GROSS'] > 50000) * ((rules['GROSS'] - 50000) * 0.10))"),
        SalaryRule(structure_id=struct_id, name="Net Salary", code="NET", category=RuleCategory.NET, sequence=500, computation_type=ComputationType.FORMULA, formula_expression="rules['GROSS'] - (rules['PF'] + rules['PT'] + rules['TDS'] + rules['UNPAID_DED'])")
    ]
    for r in rules_data:
        await r.insert()

    # 5. Time Off Types
    print("Creating Time Off Types...")
    tot_pto = await TimeOffType(name="Paid Time Off", code="PTO", unit=LeaveUnit.DAYS, requires_allocation=True, is_paid=True, color_code="#10B981").insert()
    tot_sick = await TimeOffType(name="Sick Leave", code="SICK", unit=LeaveUnit.DAYS, requires_allocation=True, is_paid=True, color_code="#F59E0B").insert()
    tot_unpaid = await TimeOffType(name="Unpaid Leave", code="UNPAID", unit=LeaveUnit.DAYS, requires_allocation=False, is_paid=False, color_code="#EF4444").insert()

    # 6. Employees
    print("Creating Employees...")
    pw_hash = get_password_hash("password123")

    # Manager / Admin Employee
    emp_alice = await Employee(
        employee_code="EMP001",
        first_name="Alice",
        last_name="Johnson",
        email="alice.johnson@peoplepay.com",
        phone="+91 98765 43210",
        avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
        department_id=str(dept_hr.id),
        job_position_id=str(pos_hr_mgr.id),
        working_schedule_id=str(schedule_std.id),
        bank_details=BankDetails(bank_name="HDFC Bank", account_number="50100234567891", ifsc_or_swift="HDFC0001234", pan_or_tax_id="ABCDE1234F")
    ).insert()

    # Senior Tech Lead
    emp_bob = await Employee(
        employee_code="EMP002",
        first_name="Bob",
        last_name="Smith",
        email="bob.smith@peoplepay.com",
        phone="+91 98765 43211",
        avatar_url="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
        department_id=str(dept_eng.id),
        job_position_id=str(pos_lead.id),
        manager_id=str(emp_alice.id),
        working_schedule_id=str(schedule_std.id),
        bank_details=BankDetails(bank_name="State Bank of India", account_number="30200456789012", ifsc_or_swift="SBIN0004567", pan_or_tax_id="BCDEF2345G")
    ).insert()

    # Engineer
    emp_carol = await Employee(
        employee_code="EMP003",
        first_name="Carol",
        last_name="Danvers",
        email="carol.danvers@peoplepay.com",
        phone="+91 98765 43212",
        avatar_url="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150",
        department_id=str(dept_eng.id),
        job_position_id=str(pos_dev.id),
        manager_id=str(emp_bob.id),
        working_schedule_id=str(schedule_std.id),
        bank_details=BankDetails(bank_name="ICICI Bank", account_number="00120198765432", ifsc_or_swift="ICIC0000012", pan_or_tax_id="CDEFG3456H")
    ).insert()

    # Sales Executive
    emp_david = await Employee(
        employee_code="EMP004",
        first_name="David",
        last_name="Miller",
        email="david.miller@peoplepay.com",
        phone="+91 98765 43213",
        avatar_url="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150",
        department_id=str(dept_sales.id),
        job_position_id=str(pos_sales.id),
        manager_id=str(emp_alice.id),
        working_schedule_id=str(schedule_std.id),
        bank_details=BankDetails(bank_name="Axis Bank", account_number="91200345678901", ifsc_or_swift="UTIB0000123", pan_or_tax_id="DEFGH4567J")
    ).insert()

    # Employee with MISSING bank details (to demonstrate warning system!)
    emp_eva = await Employee(
        employee_code="EMP005",
        first_name="Eva",
        last_name="Green",
        email="eva.green@peoplepay.com",
        phone="+91 98765 43214",
        avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        department_id=str(dept_mkt.id),
        job_position_id=str(pos_mkt.id),
        manager_id=str(emp_alice.id),
        working_schedule_id=str(schedule_std.id),
        bank_details=BankDetails(bank_name="", account_number="", ifsc_or_swift="", pan_or_tax_id="") # INTENTIONALLY MISSING!
    ).insert()

    # 7. Users & Roles
    print("Creating Users...")
    await User(email="admin@peoplepay.com", password_hash=pw_hash, role=UserRole.ADMIN, employee_id=str(emp_alice.id)).insert()
    await User(email="hrmanager@peoplepay.com", password_hash=pw_hash, role=UserRole.HR_MANAGER, employee_id=str(emp_alice.id)).insert()
    await User(email="payrollmgr@peoplepay.com", password_hash=pw_hash, role=UserRole.HR_PAYROLL_MANAGER, employee_id=str(emp_alice.id)).insert()
    await User(email="payrolluser@peoplepay.com", password_hash=pw_hash, role=UserRole.HR_PAYROLL_USER, employee_id=str(emp_bob.id)).insert()
    await User(email="employee@peoplepay.com", password_hash=pw_hash, role=UserRole.EMPLOYEE, employee_id=str(emp_carol.id)).insert()

    # 8. Contracts
    print("Creating Contracts...")
    now = datetime.utcnow()
    c_start = datetime(2025, 1, 1)
    
    con_alice = await Contract(
        contract_code="CON-2025-001",
        employee_id=str(emp_alice.id),
        department_id=str(dept_hr.id),
        job_position_id=str(pos_hr_mgr.id),
        start_date=c_start,
        status=ContractStatus.RUNNING,
        wage=120000.0,
        salary_structure_id=struct_id
    ).insert()

    con_bob = await Contract(
        contract_code="CON-2025-002",
        employee_id=str(emp_bob.id),
        department_id=str(dept_eng.id),
        job_position_id=str(pos_lead.id),
        start_date=c_start,
        status=ContractStatus.RUNNING,
        wage=140000.0,
        salary_structure_id=struct_id
    ).insert()

    con_carol = await Contract(
        contract_code="CON-2025-003",
        employee_id=str(emp_carol.id),
        department_id=str(dept_eng.id),
        job_position_id=str(pos_dev.id),
        start_date=c_start,
        status=ContractStatus.RUNNING,
        wage=85000.0,
        salary_structure_id=struct_id
    ).insert()

    con_david = await Contract(
        contract_code="CON-2025-004",
        employee_id=str(emp_david.id),
        department_id=str(dept_sales.id),
        job_position_id=str(pos_sales.id),
        start_date=c_start,
        status=ContractStatus.RUNNING,
        wage=75000.0,
        salary_structure_id=struct_id
    ).insert()

    con_eva = await Contract(
        contract_code="CON-2025-005",
        employee_id=str(emp_eva.id),
        department_id=str(dept_mkt.id),
        job_position_id=str(pos_mkt.id),
        start_date=c_start,
        status=ContractStatus.RUNNING,
        wage=65000.0,
        salary_structure_id=struct_id
    ).insert()

    # 9. Time Off Allocations & Sample Requests
    print("Creating Time Off Allocations & Requests...")
    valid_from = datetime(2026, 1, 1)
    valid_to = datetime(2026, 12, 31)

    for emp in [emp_alice, emp_bob, emp_carol, emp_david, emp_eva]:
        # 20 PTO days
        await TimeOffAllocation(
            employee_id=str(emp.id),
            time_off_type_id=str(tot_pto.id),
            allocated_units=20.0,
            taken_units=2.0 if emp.id == emp_carol.id else 0.0,
            remaining_units=18.0 if emp.id == emp_carol.id else 20.0,
            valid_from=valid_from,
            valid_to=valid_to,
            status="APPROVED"
        ).insert()

    # Carol has 1 approved PTO request (2 days)
    await TimeOffRequest(
        employee_id=str(emp_carol.id),
        time_off_type_id=str(tot_pto.id),
        start_date=datetime(2026, 3, 4),
        end_date=datetime(2026, 3, 5),
        duration_units=2.0,
        reason="Family function",
        status=TimeOffRequestStatus.APPROVED,
        approved_by=str(emp_alice.id)
    ).insert()

    # David has 1 pending PTO request (3 days)
    await TimeOffRequest(
        employee_id=str(emp_david.id),
        time_off_type_id=str(tot_pto.id),
        start_date=datetime(2026, 3, 10),
        end_date=datetime(2026, 3, 12),
        duration_units=3.0,
        reason="Annual vacation",
        status=TimeOffRequestStatus.PENDING
    ).insert()

    # 10. Sample Attendance Entries
    print("Creating Attendance Entries...")
    for day_offset in range(1, 6):
        att_date = datetime(2026, 3, day_offset, 0, 0, 0)
        for emp in [emp_alice, emp_bob, emp_carol, emp_david]:
            await Attendance(
                employee_id=str(emp.id),
                date=att_date,
                check_in=datetime(2026, 3, day_offset, 9, 2, 0),
                check_out=datetime(2026, 3, day_offset, 18, 5, 0),
                worked_hours=8.05,
                status=AttendanceStatus.PRESENT
            ).insert()

    # 11. Past Completed Payrun (February 2026)
    print("Creating Past Completed Payrun...")
    p_start = datetime(2026, 2, 1)
    p_end = datetime(2026, 2, 28)
    
    payrun_feb = await Payrun(
        name="February 2026 Regular Payrun",
        period_start=p_start,
        period_end=p_end,
        salary_structure_id=struct_id,
        status=PayrunStatus.PAID,
        selected_employee_ids=[str(emp_alice.id), str(emp_bob.id), str(emp_carol.id), str(emp_david.id)],
        total_employees=4
    ).insert()

    feb_emps = [
        (emp_alice, con_alice),
        (emp_bob, con_bob),
        (emp_carol, con_carol),
        (emp_david, con_david)
    ]
    tot_g, tot_d, tot_n = 0.0, 0.0, 0.0
    seq = 1
    for emp, con in feb_emps:
        lines, basic, gross, ded, net = evaluate_salary_rules(
            contract_wage=con.wage,
            worked_days=20.0,
            unpaid_days=0.0,
            total_working_days=20.0,
            rules=rules_data
        )
        slip = await Payslip(
            payslip_number=f"SLIP/2026/02/{seq:03d}",
            payrun_id=str(payrun_feb.id),
            employee_id=str(emp.id),
            contract_id=str(con.id),
            period_start=p_start,
            period_end=p_end,
            status="PAID",
            worked_days=20.0,
            unpaid_leave_days=0.0,
            basic_salary=basic,
            gross_salary=gross,
            total_deductions=ded,
            net_salary=net,
            lines=lines,
            warnings=[]
        ).insert()
        seq += 1
        tot_g += gross
        tot_d += ded
        tot_n += net

    payrun_feb.total_gross = round(tot_g, 2)
    payrun_feb.total_deductions = round(tot_d, 2)
    payrun_feb.total_net = round(tot_n, 2)
    await payrun_feb.save()

    print("[SUCCESS] SEEDING COMPLETED SUCCESSFULLY!")
    print("Demo Users Created:")
    print("  - Admin: admin@peoplepay.com / password123")
    print("  - HR Manager: hrmanager@peoplepay.com / password123")
    print("  - Payroll Manager: payrollmgr@peoplepay.com / password123")
    print("  - Payroll User: payrolluser@peoplepay.com / password123")
    print("  - Employee: employee@peoplepay.com / password123")

if __name__ == "__main__":
    asyncio.run(seed())
