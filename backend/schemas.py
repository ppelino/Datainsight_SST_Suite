from typing import Optional
from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

    # Valores padrão para facilitar na criação
    role: str = "user"          # admin / gestor / user
    plan: str = "free"          # free / pro / enterprise
    company_id: Optional[int] = None


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

    class Config:
        from_attributes = True  # pydantic v2 (substitui orm_mode=True)


