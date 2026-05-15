from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from jose import jwt, JWTError, ExpiredSignatureError

from database import get_db
import models, schemas
from auth import hash_password, verify_password, create_token, SECRET_KEY, ALGORITHM

router = APIRouter(prefix="/auth", tags=["auth"])


def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    if not authorization:
        raise HTTPException(status_code=401, detail="Token não informado")

    try:
        scheme, token = authorization.split()

        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Tipo de token inválido")

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("id")

        if not user_id:
            raise HTTPException(status_code=401, detail="Token inválido")

        user = db.query(models.User).filter(models.User.id == user_id).first()

        if not user:
            raise HTTPException(status_code=401, detail="Usuário não encontrado")

        if not user.is_active:
            raise HTTPException(status_code=403, detail="Usuário inativo")

        return user

    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except ValueError:
        raise HTTPException(status_code=401, detail="Formato do token inválido")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")


def require_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Acesso permitido apenas para administrador"
        )

    return current_user


@router.post("/register", response_model=schemas.UserResponse)
def register(
    user: schemas.UserCreate,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Cadastro controlado.

    Regra:
    - Se não existir nenhum usuário no sistema, cria o primeiro usuário como ADMIN.
    - Depois disso, somente ADMIN pode criar novos usuários.
    """

    total_users = db.query(models.User).count()

    if total_users > 0:
        if not authorization:
            raise HTTPException(
                status_code=401,
                detail="Somente administrador pode criar usuários"
            )

        try:
            scheme, token = authorization.split()

            if scheme.lower() != "bearer":
                raise HTTPException(status_code=401, detail="Tipo de token inválido")

            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            admin_id = payload.get("id")

            admin = db.query(models.User).filter(models.User.id == admin_id).first()

            if not admin or admin.role != "admin":
                raise HTTPException(
                    status_code=403,
                    detail="Somente administrador pode criar usuários"
                )

        except ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expirado")
        except ValueError:
            raise HTTPException(status_code=401, detail="Formato do token inválido")
        except JWTError:
            raise HTTPException(status_code=401, detail="Token inválido")

    exists = db.query(models.User).filter(models.User.email == user.email).first()

    if exists:
        raise HTTPException(status_code=400, detail="Usuário já existe")

    new_user = models.User(
        email=user.email,
        password=hash_password(user.password),
        name=user.name,
        role="admin" if total_users == 0 else user.role or "user",
        plan="enterprise" if total_users == 0 else user.plan or "free",
        company_id=user.company_id,
        is_active=True,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post("/login")
def login(data: schemas.UserLogin, db: Session = Depends(get_db)):
    """
    Login profissional.
    Retorna token + dados do usuário.
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

    return {
        "access_token": token,
        "token_type": "bearer",
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "plan": user.plan,
        "company_id": user.company_id,
        "is_active": user.is_active,
    }


@router.get("/me")
def me(current_user: models.User = Depends(get_current_user)):
    """
    Retorna os dados do usuário logado.
    """

    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "plan": current_user.plan,
        "company_id": current_user.company_id,
        "is_active": current_user.is_active,
    }


@router.get("/users", response_model=List[schemas.UserResponse])
def list_users(
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin)
):
    """
    Lista usuários.
    Apenas administrador.
    """

    users = db.query(models.User).order_by(models.User.id.desc()).all()
    return users


@router.patch("/users/{user_id}/toggle-active", response_model=schemas.UserResponse)
def toggle_user_active(
    user_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin)
):
    """
    Ativa ou inativa usuário.
    Apenas administrador.
    """

    user = db.query(models.User).filter(models.User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    if user.id == admin.id:
        raise HTTPException(
            status_code=400,
            detail="Você não pode inativar seu próprio usuário administrador"
        )

    user.is_active = not user.is_active

    db.commit()
    db.refresh(user)

    return user
