from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from app.api.deps import require_roles
from app.models.models import Payslip, Employee, Contract, UserRole
from app.services.pdf_service import generate_payslip_pdf

router = APIRouter(
    prefix="/payslips",
    tags=["Payslip Details & PDF"],
    dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.HR_PAYROLL_MANAGER, UserRole.HR_PAYROLL_USER))]
)

@router.get("/{id}")
async def get_payslip(id: str):
    slip = await Payslip.get(id)
    if not slip:
        raise HTTPException(status_code=404, detail="Payslip not found")
    
    emp = await Employee.get(slip.employee_id)
    contract = await Contract.get(slip.contract_id)

    d = slip.dict()
    d["id"] = str(slip.id)
    d["employee_name"] = f"{emp.first_name} {emp.last_name}" if emp else "Unknown"
    d["employee_code"] = emp.employee_code if emp else "Unknown"
    d["contract_code"] = contract.contract_code if contract else "Unknown"
    d["wage"] = contract.wage if contract else 0.0
    return d

@router.get("/{id}/pdf")
async def download_payslip_pdf(id: str):
    """
    Generates and streams a high-resolution corporate PDF payslip.
    """
    slip = await Payslip.get(id)
    if not slip:
        raise HTTPException(status_code=404, detail="Payslip not found")

    emp = await Employee.get(slip.employee_id)
    contract = await Contract.get(slip.contract_id)
    if not emp or not contract:
        raise HTTPException(status_code=400, detail="Incomplete employee or contract data to generate PDF")

    pdf_stream = generate_payslip_pdf(payslip=slip, employee=emp, contract=contract)
    filename = f"Payslip_{slip.payslip_number.replace('/', '_')}.pdf"

    return StreamingResponse(
        pdf_stream,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={filename}"}
    )
