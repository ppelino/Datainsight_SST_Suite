from datetime import date, datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import AsoRecord, User, Company
from routers.auth_router import get_current_user

router = APIRouter(
    prefix="/api/aso",
    tags=["aso"],
)


class AsoBase(BaseModel):
    nome: str
    cpf: str
    funcao: str
    setor: str
    tipo_exame: str
    data_exame: date
    medico: Optional[str] = None
    resultado: str
    company_id: Optional[int] = None


class AsoCreate(AsoBase):
    pass


class AsoOut(AsoBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


def is_admin(user: User):
    return user.role == "admin"


def get_default_company_id(db: Session, current_user: User):
    if is_admin(current_user):
        return current_user.company_id

    company = (
        db.query(Company)
        .filter(Company.owner_id == current_user.id)
        .order_by(Company.id.desc())
        .first()
    )

    return company.id if company else None


def validate_company_access(db: Session, company_id: Optional[int], current_user: User):
    if is_admin(current_user):
        return True

    if not company_id:
        return False

    company = (
        db.query(Company)
        .filter(
            Company.id == company_id,
            Company.owner_id == current_user.id
        )
        .first()
    )

    return company is not None


def base_query_for_user(db: Session, current_user: User):
    query = db.query(AsoRecord)

    if is_admin(current_user):
        return query

    owned_company_ids = (
        db.query(Company.id)
        .filter(Company.owner_id == current_user.id)
        .subquery()
    )

    return query.filter(AsoRecord.company_id.in_(owned_company_ids))


@router.post("/records", response_model=AsoOut)
def create_aso_record(
    payload: AsoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        data = payload.dict()

        company_id = data.get("company_id") or get_default_company_id(db, current_user)

        if not company_id:
            raise HTTPException(
                status_code=400,
                detail="Nenhuma empresa vinculada ao usuário. Cadastre uma empresa primeiro."
            )

        if not validate_company_access(db, company_id, current_user):
            raise HTTPException(
                status_code=403,
                detail="Sem permissão para registrar ASO nesta empresa."
            )

        data["company_id"] = company_id

        db_aso = AsoRecord(**data)

        db.add(db_aso)
        db.commit()
        db.refresh(db_aso)

        return db_aso

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()
        print("Erro ao salvar ASO:", e)
        raise HTTPException(status_code=500, detail="Erro ao salvar ASO no banco.")


@router.get("/records", response_model=List[AsoOut])
def list_aso_records(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return (
        base_query_for_user(db, current_user)
        .order_by(AsoRecord.created_at.desc())
        .all()
    )


@router.delete("/records/{record_id}", response_model=dict)
def delete_aso_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        record = (
            base_query_for_user(db, current_user)
            .filter(AsoRecord.id == record_id)
            .first()
        )

        if not record:
            raise HTTPException(
                status_code=404,
                detail="Registro não encontrado ou sem permissão para excluir."
            )

        db.delete(record)
        db.commit()

        return {"msg": "Registro excluído com sucesso."}

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()
        print("Erro ao excluir:", e)
        raise HTTPException(status_code=500, detail="Erro ao excluir registro.")


@router.get("/dashboard/pcmsos")
def dashboard_pcmsos(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = base_query_for_user(db, current_user)

    format_expr = func.to_char(AsoRecord.data_exame, "MM/YYYY")

    exames_rows = (
        query.with_entities(
            format_expr.label("mes"),
            func.count(AsoRecord.id).label("total"),
        )
        .group_by(format_expr)
        .order_by(format_expr)
        .all()
    )

    exames_por_mes = [
        {"mes": row.mes, "total": row.total}
        for row in exames_rows
    ]

    total = query.with_entities(func.count(AsoRecord.id)).scalar() or 0

    status_asos = {
        "validos": total,
        "vencidos": 0,
        "a_vencer": 0,
    }

    return {
        "exames_por_mes": exames_por_mes,
        "status_asos": status_asos
    }
