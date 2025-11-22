from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
import models, schemas
from auth import hash_password, verify_password, create_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Cria um novo usuário no sistema.
    Por enquanto está aberto (usa via Swagger).
    Depois você pode travar para só admin criar usuários.
    """
    exists = db.query(models.User).filter(models.User.email == user.email).first()
    if exists:
        raise HTTPException(status_code=400, detail="Usuário já existe")

    new_user = models.User(
        email=user.email,
        password=hash_password(user.password),
        name=user.name,
        role=user.role or "user",
        plan=user.plan or "free",
        company_id=user.company_id,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login")
def login(data: schemas.UserLogin, db: Session = Depends(get_db)):
    """
    Login profissional.
    Retorna token + dados do usuário (role, plano, empresa).
    """
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Usuário não encontrado")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Usuário inativo")

    if not verify_password(data.password, user.password):
        raise HTTPException(status_code=400, detail="Senha incorreta")

    token = create_token(
        {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "plan": user.plan,
            "company_id": user.company_id,
        }
    )

    # Mantém o formato antigo para o frontend atual,
    # mas já devolve infos profissionais também.
    return {
        "access_token": token,
        "token_type": "bearer",
        "name": user.name,
        "role": user.role,
        "plan": user.plan,
        "company_id": user.company_id,
    }



