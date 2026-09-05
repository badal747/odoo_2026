from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.api.deps import require_roles
from app.models.models import (
    SalaryStructure, SalaryRule, RuleCategory, ComputationType, UserRole
)

router = APIRouter(prefix="/payroll-config", tags=["Salary Configuration"])

class StructureCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = ""
    active: bool = True

class RuleCreate(BaseModel):
    structure_id: str
    name: str
    code: str
    category: RuleCategory
    sequence: int
    computation_type: ComputationType
    fixed_amount: Optional[float] = 0.0
    percentage: Optional[float] = 0.0
    percentage_base_code: Optional[str] = None
    formula_expression: Optional[str] = None
    active: bool = True

# ----------------- SALARY STRUCTURES -----------------
@router.get("/structures", dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.HR_PAYROLL_MANAGER, UserRole.HR_PAYROLL_USER))])
async def list_structures():
    structures = await SalaryStructure.find_all().to_list()
    res = []
    for s in structures:
        rules_count = await SalaryRule.find(SalaryRule.structure_id == str(s.id)).count()
        d = s.dict()
        d["id"] = str(s.id)
        d["rules_count"] = rules_count
        res.append(d)
    return res

@router.get("/structures/{id}", dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.HR_PAYROLL_MANAGER, UserRole.HR_PAYROLL_USER))])
async def get_structure(id: str):
    structure = await SalaryStructure.get(id)
    if not structure:
        raise HTTPException(status_code=404, detail="Structure not found")
    
    rules = await SalaryRule.find(SalaryRule.structure_id == id).sort("sequence").to_list()
    d = structure.dict()
    d["id"] = str(structure.id)
    d["rules"] = [{**r.dict(), "id": str(r.id)} for r in rules]
    return d

@router.post("/structures", dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.HR_PAYROLL_MANAGER))])
async def create_structure(req: StructureCreate):
    existing = await SalaryStructure.find_one(SalaryStructure.code == req.code)
    if existing:
        raise HTTPException(status_code=400, detail="Structure code already exists")
    s = SalaryStructure(**req.dict())
    await s.insert()
    return {"id": str(s.id), "name": s.name}

# ----------------- SALARY RULES -----------------
@router.get("/rules", dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.HR_PAYROLL_MANAGER, UserRole.HR_PAYROLL_USER))])
async def list_rules(structure_id: Optional[str] = None):
    query = {}
    if structure_id:
        query["structure_id"] = structure_id
    rules = await SalaryRule.find(query).sort("sequence").to_list()
    return [{**r.dict(), "id": str(r.id)} for r in rules]

@router.post("/rules", dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.HR_PAYROLL_MANAGER))])
async def create_rule(req: RuleCreate):
    existing = await SalaryRule.find_one(
        SalaryRule.structure_id == req.structure_id,
        SalaryRule.code == req.code
    )
    if existing:
        raise HTTPException(status_code=400, detail=f"Rule code '{req.code}' already exists in this structure")
    
    r = SalaryRule(**req.dict())
    await r.insert()
    return {"id": str(r.id), "name": r.name}

@router.put("/rules/{id}", dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.HR_PAYROLL_MANAGER))])
async def update_rule(id: str, req: RuleCreate):
    rule = await SalaryRule.get(id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    for k, v in req.dict().items():
        setattr(rule, k, v)
    await rule.save()
    return {"id": str(rule.id), "message": "Rule updated successfully"}

@router.delete("/rules/{id}", dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.HR_PAYROLL_MANAGER))])
async def delete_rule(id: str):
    rule = await SalaryRule.get(id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    await rule.delete()
    return {"message": "Rule deleted"}
