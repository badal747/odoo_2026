from datetime import timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr
from app.models.models import User, UserRole, Employee
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

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

