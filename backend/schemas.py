from typing import Optional
from datetime import date
from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "user"
    plan: str = "free"
    company_id: Optional[int] = None
    plan_expires_at: Optional[date] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    name: str
    role: str
    plan: str
    company_id: Optional[int]
    is_active: bool
    plan_expires_at: Optional[date]

    class Config:
        from_attributes = True
