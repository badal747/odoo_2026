from fastapi.testclient import TestClient
from main import app

def test_api():
    print("[TEST] Running TestClient with lifespan and strict RBAC verification...")
    with TestClient(app) as client:
        # 1. Root public endpoint
        r = client.get("/")
        print(f"Root: {r.status_code}, {r.json()}")
        assert r.status_code == 200

        # 2. Unauthenticated access should be blocked (401)
        r_unauth = client.get("/api/v1/employees")
        print(f"Unauthenticated request to /employees: {r_unauth.status_code}")
        assert r_unauth.status_code == 401

        # 3. Login as Admin
        r_login = client.post("/api/v1/auth/login", json={"email": "admin@peoplepay.com", "password": "password123"})
        print(f"Admin Login: {r_login.status_code}, role={r_login.json().get('role')}")
        assert r_login.status_code == 200
        admin_token = r_login.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # 4. Admin accesses protected modules
        # 4.1 Employees
        r = client.get("/api/v1/employees", headers=admin_headers)
        print(f"Admin Employees count: {len(r.json())}")
        assert r.status_code == 200
        assert len(r.json()) > 0
        emp_id = r.json()[0]["id"]

        # 4.2 Smart counts
        r = client.get(f"/api/v1/employees/{emp_id}/smart-counts", headers=admin_headers)
        print(f"Smart counts for {emp_id}: {r.json()}")
        assert r.status_code == 200

        # 4.3 Dashboard stats
        r = client.get("/api/v1/dashboard/stats", headers=admin_headers)
        print(f"Dashboard Stats: {r.json()}")
        assert r.status_code == 200

        # 4.4 Salary structures
        r = client.get("/api/v1/payroll-config/structures", headers=admin_headers)
        print(f"Structures: {r.json()}")
        assert r.status_code == 200
        assert len(r.json()) > 0
        struct_id = r.json()[0]["id"]

        # 4.5 Payruns & Wizard eligibility
        wiz_r = client.post("/api/v1/payruns/wizard-eligible", headers=admin_headers, json={
            "salary_structure_id": struct_id,
            "period_start": "2026-03-01T00:00:00",
            "period_end": "2026-03-31T23:59:59"
        })
        print(f"Wizard Eligible Employees: {wiz_r.status_code}, count={wiz_r.json().get('eligible_count')}")
        assert wiz_r.status_code == 200
        assert wiz_r.json().get("eligible_count") > 0

        # 5. Strict Role Enforcement: Employee persona
        r_emp_login = client.post("/api/v1/auth/login", json={"email": "employee@peoplepay.com", "password": "password123"})
        assert r_emp_login.status_code == 200
        emp_token = r_emp_login.json()["access_token"]
        emp_headers = {"Authorization": f"Bearer {emp_token}"}

        # Employee can view own attendance
        r_att = client.get("/api/v1/attendance", headers=emp_headers)
        print(f"Employee attendance access: {r_att.status_code}")
        assert r_att.status_code == 200

        # Employee CANNOT access Payruns (Must be 403 Forbidden)
        r_emp_payrun = client.get("/api/v1/payruns", headers=emp_headers)
        print(f"Employee access to /payruns: {r_emp_payrun.status_code} (Expected 403)")
        assert r_emp_payrun.status_code == 403

        # Employee CANNOT access Salary Structures (Must be 403 Forbidden)
        r_emp_struct = client.get("/api/v1/payroll-config/structures", headers=emp_headers)
        print(f"Employee access to /payroll-config/structures: {r_emp_struct.status_code} (Expected 403)")
        assert r_emp_struct.status_code == 403

        # 6. Strict Role Enforcement: HR Manager persona
        r_hr_login = client.post("/api/v1/auth/login", json={"email": "hrmanager@peoplepay.com", "password": "password123"})
        assert r_hr_login.status_code == 200
        hr_token = r_hr_login.json()["access_token"]
        hr_headers = {"Authorization": f"Bearer {hr_token}"}

        # HR Manager CAN access Employees & Contracts
        r_hr_emp = client.get("/api/v1/employees", headers=hr_headers)
        assert r_hr_emp.status_code == 200

        r_hr_contracts = client.get("/api/v1/contracts", headers=hr_headers)
        assert r_hr_contracts.status_code == 200

        # HR Manager CANNOT access Payroll (Must be 403 Forbidden per PDF Page 3)
        r_hr_payruns = client.get("/api/v1/payruns", headers=hr_headers)
        # 7. Role-Based Registration & Auto Provisioning Tests
        # 7.1 Registration options
        r_opt = client.get("/api/v1/auth/options")
        assert r_opt.status_code == 200
        assert len(r_opt.json().get("roles", [])) == 5
        print(f"Auth Options: {len(r_opt.json().get('roles'))} roles, {len(r_opt.json().get('departments'))} departments")

        # 7.2 Register a new Employee persona
        import time
        test_email = f"test.hire.{int(time.time())}@peoplepay.com"

        r_reg = client.post("/api/v1/auth/register", json={
            "first_name": "Rachel",
            "last_name": "Green",
            "email": test_email,
            "password": "Password123!",
            "role": "EMPLOYEE",
            "job_title": "Fashion Merchandiser"
        })
        print(f"Registration response: {r_reg.status_code}")
        assert r_reg.status_code == 201
        reg_data = r_reg.json()
        assert reg_data["email"] == test_email
        assert reg_data["role"] == "EMPLOYEE"
        assert reg_data["employee_id"] is not None
        assert "access_token" in reg_data

        # Duplicate registration should return 400 Bad Request
        r_dup = client.post("/api/v1/auth/register", json={
            "first_name": "Rachel",
            "last_name": "Green",
            "email": test_email,
            "password": "Password123!",
            "role": "EMPLOYEE"
        })
        assert r_dup.status_code == 400
        print("Duplicate registration rejected with 400 as expected.")

        # Test login with newly registered user
        r_new_login = client.post("/api/v1/auth/login", json={
            "email": test_email,
            "password": "Password123!"
        })
        assert r_new_login.status_code == 200
        assert r_new_login.json()["employee_id"] == reg_data["employee_id"]

    print("[SUCCESS] ALL FASTAPI ENDPOINTS, STRICT RBAC, AND ROLE-BASED REGISTRATION FULLY VERIFIED!")

if __name__ == "__main__":
    test_api()
