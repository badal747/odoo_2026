from fastapi.testclient import TestClient
from main import app

def test_api():
    print("[TEST] Running TestClient with lifespan...")
    with TestClient(app) as client:
        # 1. Root
        r = client.get("/")
        print(f"Root: {r.status_code}, {r.json()}")
        assert r.status_code == 200

        # 2. Login as admin
        r = client.post("/api/v1/auth/login", json={"email": "admin@peoplepay.com", "password": "password123"})
        print(f"Login: {r.status_code}, role={r.json().get('role')}")
        assert r.status_code == 200

        # 3. List employees
        r = client.get("/api/v1/employees")
        print(f"Employees count: {len(r.json())}")
        assert len(r.json()) > 0
        emp_id = r.json()[0]["id"]

        # 4. Smart counts
        r = client.get(f"/api/v1/employees/{emp_id}/smart-counts")
        print(f"Smart counts for {emp_id}: {r.json()}")
        assert r.status_code == 200

        # 5. Dashboard stats
        r = client.get("/api/v1/dashboard/stats")
        print(f"Dashboard Stats: {r.json()}")
        assert r.status_code == 200

        # 6. Dashboard Department Costs
        r = client.get("/api/v1/dashboard/department-costs")
        print(f"Department Costs: {r.json()}")
        assert r.status_code == 200

        # 7. Salary Structures
        r = client.get("/api/v1/payroll-config/structures")
        print(f"Structures: {r.json()}")
        assert len(r.json()) > 0

        # 8. Wizard Eligibility Check
        struct_id = r.json()[0]["id"]
        wiz_r = client.post("/api/v1/payruns/wizard-eligible", json={
            "salary_structure_id": struct_id,
            "period_start": "2026-03-01T00:00:00",
            "period_end": "2026-03-31T23:59:59"
        })
        print(f"Wizard Eligible Employees: {wiz_r.status_code}, count={wiz_r.json().get('eligible_count')}")
        assert wiz_r.status_code == 200
        assert wiz_r.json().get('eligible_count') > 0

    print("[SUCCESS] ALL FASTAPI ENDPOINTS VERIFIED & WORKING WITH MONGODB ATLAS!")

if __name__ == "__main__":
    test_api()
