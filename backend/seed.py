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
    print("Creating 5 Departments...")
    dept_eng = await Department(name="Engineering & Tech", code="ENG").insert()
    dept_hr = await Department(name="Human Resources", code="HR").insert()
    dept_sales = await Department(name="Sales & Revenue", code="SALES").insert()
    dept_mkt = await Department(name="Growth & Marketing", code="MKT").insert()
    dept_fin = await Department(name="Finance & Legal", code="FIN").insert()

    # 2. Job Positions
    print("Creating Job Positions...")
    pos_lead = await JobPosition(title="Lead Software Architect", department_id=str(dept_eng.id)).insert()
    pos_dev = await JobPosition(title="Senior Fullstack Engineer", department_id=str(dept_eng.id)).insert()
    pos_devops = await JobPosition(title="Cloud & DevOps Engineer", department_id=str(dept_eng.id)).insert()
    pos_intern = await JobPosition(title="Software Engineer Intern", department_id=str(dept_eng.id)).insert()

    pos_hr_dir = await JobPosition(title="HR Director", department_id=str(dept_hr.id)).insert()
    pos_hr_spec = await JobPosition(title="Talent & People Ops Specialist", department_id=str(dept_hr.id)).insert()

    pos_sales_exec = await JobPosition(title="Enterprise Account Executive", department_id=str(dept_sales.id)).insert()
    pos_sales_mgr = await JobPosition(title="Regional Sales Manager", department_id=str(dept_sales.id)).insert()
    pos_sdr = await JobPosition(title="Sales Development Rep", department_id=str(dept_sales.id)).insert()

    pos_mkt_spec = await JobPosition(title="Digital Marketing Specialist", department_id=str(dept_mkt.id)).insert()
    pos_mkt_content = await JobPosition(title="Content & Brand Strategist", department_id=str(dept_mkt.id)).insert()

    pos_fin_ctrl = await JobPosition(title="Financial Controller", department_id=str(dept_fin.id)).insert()
    pos_legal = await JobPosition(title="Corporate Legal Counsel", department_id=str(dept_fin.id)).insert()
    pos_audit = await JobPosition(title="Internal Auditor", department_id=str(dept_fin.id)).insert()

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

    # 6. Employees (15 staff across all departments & employment types)
    print("Creating 15 Employees across 5 Departments...")
    pw_hash = get_password_hash("password123")

    emp_raw_data = [
        # (code, first, last, email, phone, avatar, dept, pos, emp_type, wage, has_bank)
        ("EMP001", "Alice", "Johnson", "alice.johnson@peoplepay.com", "+91 98765 43210", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150", dept_hr.id, pos_hr_dir.id, EmploymentType.FULL_TIME, 130000.0, True),
        ("EMP002", "Bob", "Smith", "bob.smith@peoplepay.com", "+91 98765 43211", "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150", dept_eng.id, pos_lead.id, EmploymentType.FULL_TIME, 150000.0, True),
        ("EMP003", "Carol", "Danvers", "carol.danvers@peoplepay.com", "+91 98765 43212", "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150", dept_eng.id, pos_dev.id, EmploymentType.FULL_TIME, 90000.0, True),
        ("EMP004", "David", "Miller", "david.miller@peoplepay.com", "+91 98765 43213", "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150", dept_sales.id, pos_sales_exec.id, EmploymentType.FULL_TIME, 80000.0, True),
        ("EMP005", "Eva", "Green", "eva.green@peoplepay.com", "+91 98765 43214", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150", dept_mkt.id, pos_mkt_spec.id, EmploymentType.FULL_TIME, 70000.0, False), # INTENTIONALLY MISSING BANK INFO FOR WARNING DEMO
        ("EMP006", "Grace", "Hopper", "grace.hopper@peoplepay.com", "+91 98765 43215", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150", dept_hr.id, pos_hr_spec.id, EmploymentType.FULL_TIME, 65000.0, True),
        ("EMP007", "Frank", "Castle", "frank.castle@peoplepay.com", "+91 98765 43216", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150", dept_eng.id, pos_devops.id, EmploymentType.FULL_TIME, 110000.0, True),
        ("EMP008", "Hank", "Pym", "hank.pym@peoplepay.com", "+91 98765 43217", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150", dept_eng.id, pos_dev.id, EmploymentType.FULL_TIME, 95000.0, True),
        ("EMP009", "Ian", "Malcolm", "ian.malcolm@peoplepay.com", "+91 98765 43218", "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150", dept_eng.id, pos_intern.id, EmploymentType.INTERN, 35000.0, True),
        ("EMP010", "Jessica", "Jones", "jessica.jones@peoplepay.com", "+91 98765 43219", "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150", dept_sales.id, pos_sales_mgr.id, EmploymentType.FULL_TIME, 105000.0, True),
        ("EMP011", "Kevin", "Flynn", "kevin.flynn@peoplepay.com", "+91 98765 43220", "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150", dept_sales.id, pos_sdr.id, EmploymentType.PART_TIME, 45000.0, True),
        ("EMP012", "Laura", "Croft", "laura.croft@peoplepay.com", "+91 98765 43221", "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150", dept_mkt.id, pos_mkt_content.id, EmploymentType.FULL_TIME, 75000.0, True),
        ("EMP013", "Maya", "Lin", "maya.lin@peoplepay.com", "+91 98765 43222", "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150", dept_fin.id, pos_fin_ctrl.id, EmploymentType.FULL_TIME, 125000.0, True),
        ("EMP014", "Nathan", "Drake", "nathan.drake@peoplepay.com", "+91 98765 43223", "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150", dept_fin.id, pos_legal.id, EmploymentType.CONTRACT, 115000.0, True),
        ("EMP015", "Olivia", "Dunham", "olivia.dunham@peoplepay.com", "+91 98765 43224", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150", dept_fin.id, pos_audit.id, EmploymentType.FULL_TIME, 85000.0, True)
    ]

    employees = []
    contracts = []

    for code, first, last, email, phone, avatar, dept_id, pos_id, emp_type, wage, has_bank in emp_raw_data:
        bank = BankDetails(
            bank_name="HDFC Bank" if has_bank else "",
            account_number=f"501002{code[3:]}94827" if has_bank else "",
            ifsc_or_swift="HDFC0001234" if has_bank else "",
            pan_or_tax_id=f"ABCDE{code[3:]}234F" if has_bank else ""
        )
        emp = await Employee(
            employee_code=code,
            first_name=first,
            last_name=last,
            email=email,
            phone=phone,
            avatar_url=avatar,
            department_id=str(dept_id),
            job_position_id=str(pos_id),
            employment_type=emp_type,
            working_schedule_id=str(schedule_std.id),
            bank_details=bank,
            status=EmployeeStatus.ACTIVE
        ).insert()
        employees.append(emp)

        con = await Contract(
            contract_code=f"CON-2025-{code[3:]}",
            employee_id=str(emp.id),
            department_id=str(dept_id),
            job_position_id=str(pos_id),
            start_date=datetime(2025, 1, 1),
            status=ContractStatus.RUNNING,
            wage=wage,
            salary_structure_id=struct_id
        ).insert()
        contracts.append(con)

    emp_alice = employees[0]
    emp_bob = employees[1]
    emp_carol = employees[2]

    # 7. Users & Roles (5 Personas mapped to real accounts)
    print("Creating User Credentials for 5 RBAC Personas...")
    await User(email="admin@peoplepay.com", password_hash=pw_hash, role=UserRole.ADMIN, employee_id=str(emp_alice.id)).insert()
    await User(email="hrmanager@peoplepay.com", password_hash=pw_hash, role=UserRole.HR_MANAGER, employee_id=str(emp_alice.id)).insert()
    await User(email="payrollmgr@peoplepay.com", password_hash=pw_hash, role=UserRole.HR_PAYROLL_MANAGER, employee_id=str(emp_alice.id)).insert()
    await User(email="payrolluser@peoplepay.com", password_hash=pw_hash, role=UserRole.HR_PAYROLL_USER, employee_id=str(emp_bob.id)).insert()
    await User(email="employee@peoplepay.com", password_hash=pw_hash, role=UserRole.EMPLOYEE, employee_id=str(emp_carol.id)).insert()

    # 8. Time Off Allocations & Varied Requests
    print("Creating Time Off Allocations & Leave Requests...")
    valid_from = datetime(2026, 1, 1)
    valid_to = datetime(2026, 12, 31)

    for emp in employees:
        await TimeOffAllocation(
            employee_id=str(emp.id),
            time_off_type_id=str(tot_pto.id),
            allocated_units=20.0,
            taken_units=2.0 if emp.employee_code == "EMP003" else (1.0 if emp.employee_code == "EMP007" else 0.0),
            remaining_units=18.0 if emp.employee_code == "EMP003" else (19.0 if emp.employee_code == "EMP007" else 20.0),
            valid_from=valid_from,
            valid_to=valid_to,
            status="APPROVED"
        ).insert()

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

    # Carol has approved PTO (2 days)
    await TimeOffRequest(
        employee_id=str(employees[2].id),
        time_off_type_id=str(tot_pto.id),
        start_date=datetime(2026, 3, 4),
        end_date=datetime(2026, 3, 5),
        duration_units=2.0,
        reason="Family event",
        status=TimeOffRequestStatus.APPROVED,
        approved_by=str(emp_alice.id)
    ).insert()

    # David has pending PTO (3 days)
    await TimeOffRequest(
        employee_id=str(employees[3].id),
        time_off_type_id=str(tot_pto.id),
        start_date=datetime(2026, 3, 10),
        end_date=datetime(2026, 3, 12),
        duration_units=3.0,
        reason="Annual personal vacation",
        status=TimeOffRequestStatus.PENDING
    ).insert()

    # Ian has approved Unpaid Leave (1 day) -> triggers unpaid deduction rule
    await TimeOffRequest(
        employee_id=str(employees[8].id),
        time_off_type_id=str(tot_unpaid.id),
        start_date=datetime(2026, 3, 6),
        end_date=datetime(2026, 3, 6),
        duration_units=1.0,
        reason="Exam preparation",
        status=TimeOffRequestStatus.APPROVED,
        approved_by=str(emp_alice.id)
    ).insert()

    # 9. Attendance Entries (Diverse exceptions: Present, Late, Half-Day, Overtime, Missing Checkout, Manual Edits)
    print("Creating Diverse Attendance Logs (Section B9)...")
    for day in range(1, 8):
        att_date = datetime(2026, 3, day, 0, 0, 0)
        for idx, emp in enumerate(employees):
            # EMP004 is occasionally late
            if idx == 3 and day in [2, 4]:
                await Attendance(
                    employee_id=str(emp.id),
                    date=att_date,
                    check_in=datetime(2026, 3, day, 9, 45, 0),
                    check_out=datetime(2026, 3, day, 18, 15, 0),
                    worked_hours=7.5,
                    status=AttendanceStatus.LATE
                ).insert()
            # EMP006 took half day on day 3
            elif idx == 5 and day == 3:
                await Attendance(
                    employee_id=str(emp.id),
                    date=att_date,
                    check_in=datetime(2026, 3, day, 9, 0, 0),
                    check_out=datetime(2026, 3, day, 13, 0, 0),
                    worked_hours=4.0,
                    status=AttendanceStatus.HALF_DAY
                ).insert()
            # EMP007 worked overtime on day 5
            elif idx == 6 and day == 5:
                await Attendance(
                    employee_id=str(emp.id),
                    date=att_date,
                    check_in=datetime(2026, 3, day, 8, 30, 0),
                    check_out=datetime(2026, 3, day, 20, 0, 0),
                    worked_hours=10.5,
                    status=AttendanceStatus.OVERTIME
                ).insert()
            # EMP011 has a missing checkout on day 6
            elif idx == 10 and day == 6:
                await Attendance(
                    employee_id=str(emp.id),
                    date=att_date,
                    check_in=datetime(2026, 3, day, 9, 10, 0),
                    check_out=None,
                    worked_hours=0.0,
                    status=AttendanceStatus.PRESENT
                ).insert()
            # EMP012 has a manual edit
            elif idx == 11 and day == 4:
                await Attendance(
                    employee_id=str(emp.id),
                    date=att_date,
                    check_in=datetime(2026, 3, day, 9, 0, 0),
                    check_out=datetime(2026, 3, day, 18, 0, 0),
                    worked_hours=8.0,
                    status=AttendanceStatus.PRESENT,
                    is_manual_edit=True
                ).insert()
            else:
                # Normal on-time present
                await Attendance(
                    employee_id=str(emp.id),
                    date=att_date,
                    check_in=datetime(2026, 3, day, 9, 5, 0),
                    check_out=datetime(2026, 3, day, 18, 10, 0),
                    worked_hours=8.08,
                    status=AttendanceStatus.PRESENT
                ).insert()

    # 10. Historical Payrun 1: January 2026 (PAID)
    print("Creating January 2026 Completed Payrun (PAID)...")
    p1_start = datetime(2026, 1, 1)
    p1_end = datetime(2026, 1, 31)
    payrun_jan = await Payrun(
        name="January 2026 Regular Payrun",
        period_start=p1_start,
        period_end=p1_end,
        salary_structure_id=struct_id,
        status=PayrunStatus.PAID,
        selected_employee_ids=[str(e.id) for e in employees[:12]],
        total_employees=12
    ).insert()

    tot_g1, tot_d1, tot_n1 = 0.0, 0.0, 0.0
    for idx, (emp, con) in enumerate(zip(employees[:12], contracts[:12]), start=1):
        lines, basic, gross, ded, net = evaluate_salary_rules(
            contract_wage=con.wage,
            worked_days=22.0,
            unpaid_days=0.0,
            total_working_days=22.0,
            rules=rules_data
        )
        await Payslip(
            payslip_number=f"SLIP/2026/01/{idx:03d}",
            payrun_id=str(payrun_jan.id),
            employee_id=str(emp.id),
            contract_id=str(con.id),
            period_start=p1_start,
            period_end=p1_end,
            status="PAID",
            worked_days=22.0,
            unpaid_leave_days=0.0,
            basic_salary=basic,
            gross_salary=gross,
            total_deductions=ded,
            net_salary=net,
            lines=lines,
            warnings=[]
        ).insert()
        tot_g1 += gross
        tot_d1 += ded
        tot_n1 += net

    payrun_jan.total_gross = round(tot_g1, 2)
    payrun_jan.total_deductions = round(tot_d1, 2)
    payrun_jan.total_net = round(tot_n1, 2)
    await payrun_jan.save()

    # 11. Historical Payrun 2: February 2026 (PAID)
    print("Creating February 2026 Completed Payrun (PAID)...")
    p2_start = datetime(2026, 2, 1)
    p2_end = datetime(2026, 2, 28)
    payrun_feb = await Payrun(
        name="February 2026 Regular Payrun",
        period_start=p2_start,
        period_end=p2_end,
        salary_structure_id=struct_id,
        status=PayrunStatus.PAID,
        selected_employee_ids=[str(e.id) for e in employees[:14]],
        total_employees=14
    ).insert()

    tot_g2, tot_d2, tot_n2 = 0.0, 0.0, 0.0
    for idx, (emp, con) in enumerate(zip(employees[:14], contracts[:14]), start=1):
        lines, basic, gross, ded, net = evaluate_salary_rules(
            contract_wage=con.wage,
            worked_days=20.0,
            unpaid_days=0.0,
            total_working_days=20.0,
            rules=rules_data
        )
        await Payslip(
            payslip_number=f"SLIP/2026/02/{idx:03d}",
            payrun_id=str(payrun_feb.id),
            employee_id=str(emp.id),
            contract_id=str(con.id),
            period_start=p2_start,
            period_end=p2_end,
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
        tot_g2 += gross
        tot_d2 += ded
        tot_n2 += net

    payrun_feb.total_gross = round(tot_g2, 2)
    payrun_feb.total_deductions = round(tot_d2, 2)
    payrun_feb.total_net = round(tot_n2, 2)
    await payrun_feb.save()

    # 12. Current Payrun 3: March 2026 (COMPUTED with Eva Green missing bank details warning)
    print("Creating March 2026 Payrun (COMPUTED - Ready for Warning Resolution & Validation Demo)...")
    p3_start = datetime(2026, 3, 1)
    p3_end = datetime(2026, 3, 31)
    payrun_mar = await Payrun(
        name="March 2026 Regular Payrun",
        period_start=p3_start,
        period_end=p3_end,
        salary_structure_id=struct_id,
        status=PayrunStatus.COMPUTED,
        selected_employee_ids=[str(e.id) for e in employees],
        total_employees=15
    ).insert()

    tot_g3, tot_d3, tot_n3 = 0.0, 0.0, 0.0
    for idx, (emp, con) in enumerate(zip(employees, contracts), start=1):
        # Ian has 1 unpaid day
        unpaid = 1.0 if emp.employee_code == "EMP009" else 0.0
        worked = 21.0 - unpaid
        lines, basic, gross, ded, net = evaluate_salary_rules(
            contract_wage=con.wage,
            worked_days=worked,
            unpaid_days=unpaid,
            total_working_days=21.0,
            rules=rules_data
        )

        warnings = []
        if not emp.bank_details or not emp.bank_details.account_number:
            warnings.append("Missing bank account number")

        await Payslip(
            payslip_number=f"SLIP/2026/03/{idx:03d}",
            payrun_id=str(payrun_mar.id),
            employee_id=str(emp.id),
            contract_id=str(con.id),
            period_start=p3_start,
            period_end=p3_end,
            status="COMPUTED",
            worked_days=worked,
            unpaid_leave_days=unpaid,
            basic_salary=basic,
            gross_salary=gross,
            total_deductions=ded,
            net_salary=net,
            lines=lines,
            warnings=warnings
        ).insert()
        tot_g3 += gross
        tot_d3 += ded
        tot_n3 += net

    payrun_mar.total_gross = round(tot_g3, 2)
    payrun_mar.total_deductions = round(tot_d3, 2)
    payrun_mar.total_net = round(tot_n3, 2)
    await payrun_mar.save()

    print("\n" + "="*60)
    print(" [SUCCESS] ENTERPRISE SEEDING COMPLETE!")
    print("="*60)
    print(" 15 Staff Members across 5 Departments created.")
    print(" 3 Payruns created (Jan & Feb PAID, March COMPUTED).")
    print(" Eva Green (EMP005) flagged with Pre-Validation Warning.")
    print("\n Demo Credentials (Password: password123):")
    print("  - Admin: admin@peoplepay.com")
    print("  - HR Manager: hrmanager@peoplepay.com")
    print("  - Payroll Manager: payrollmgr@peoplepay.com")
    print("  - Payroll User: payrolluser@peoplepay.com")
    print("  - Employee: employee@peoplepay.com")
    print("="*60 + "\n")

if __name__ == "__main__":
    asyncio.run(seed())
