from datetime import date, datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import AsoRecord, User
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


class AsoCreate(AsoBase):
    pass


class AsoOut(AsoBase):
    id: int
    created_at: datetime
    company_id: Optional[int] = None

    class Config:
        from_attributes = True


def base_query_for_user(db: Session, current_user: User):
    query = db.query(AsoRecord)

    if current_user.role == "admin":
        return query

    if not current_user.company_id:
        return query.filter(AsoRecord.company_id == -1)

    return query.filter(AsoRecord.company_id == current_user.company_id)


@router.post("/records", response_model=AsoOut)
def create_aso_record(
    payload: AsoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        db_aso = AsoRecord(
            **payload.dict(),
            company_id=current_user.company_id
        )

        db.add(db_aso)
        db.commit()
        db.refresh(db_aso)

        return db_aso

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
        query = base_query_for_user(db, current_user)

        record = query.filter(AsoRecord.id == record_id).first()

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
