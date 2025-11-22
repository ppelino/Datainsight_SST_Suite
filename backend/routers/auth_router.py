from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from auth import hash_password, verify_password, create_token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register")
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    exists = db.query(models.User).filter(models.User.email == user.email).first()
    if exists:
        raise HTTPException(400, "Usuário já existe")

    new_user = models.User(
        email=user.email,
        password=hash_password(user.password),
        name=user.name,
        role="user"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"msg": "Usuário criado!"}

@router.post("/login")
def login(data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user:
        raise HTTPException(400, "Usuário não encontrado")

    if not verify_password(data.password, user.password):
        raise HTTPException(400, "Senha incorreta")

    token = create_token({"id": user.id, "email": user.email})
    return {"access_token": token}


