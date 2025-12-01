from datetime import date, datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import AsoRecord

router = APIRouter(
    prefix="/api/aso",
    tags=["aso"],
)

# -----------------------------------------
# SCHEMAS
# -----------------------------------------

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

    class Config:
        orm_mode = True


# -----------------------------------------
# CRIAR
# -----------------------------------------

@router.post("/records", response_model=AsoOut)
def create_aso_record(payload: AsoCreate, db: Session = Depends(get_db)):
    try:
        db_aso = AsoRecord(**payload.dict())
        db.add(db_aso)
        db.commit()
        db.refresh(db_aso)
        return db_aso
    except Exception as e:
        db.rollback()
        print("Erro ao salvar ASO:", e)
        raise HTTPException(status_code=500, detail="Erro ao salvar ASO no banco.")


# -----------------------------------------
# LISTAR
# -----------------------------------------

@router.get("/records", response_model=List[AsoOut])
def list_aso_records(db: Session = Depends(get_db)):
    return db.query(AsoRecord).order_by(AsoRecord.created_at.desc()).all()


# -----------------------------------------
# DELETAR
# -----------------------------------------

@router.delete("/records/{record_id}", response_model=dict)
def delete_aso_record(record_id: int, db: Session = Depends(get_db)):
    try:
        linhas = (
            db.query(AsoRecord)
            .filter(AsoRecord.id == record_id)
            .delete(synchronize_session=False)
        )
        db.commit()
        return {"msg": f"Registros afetados: {linhas}"}
    except Exception as e:
        db.rollback()
        print("Erro ao excluir:", e)
        raise HTTPException(status_code=500, detail="Erro ao excluir registro.")


# ============================================================
# DASHBOARD
# ============================================================

@router.get("/dashboard/pcmsos")
def dashboard_pcmsos(db: Session = Depends(get_db)):

    # Formatar dia/mês/ano
    format_expr = func.to_char(AsoRecord.data_exame, "MM/YYYY")

    exames_rows = (
        db.query(
            format_expr.label("mes"),
            func.count(AsoRecord.id).label("total"),
        )
        .group_by(format_expr)
        .order_by(format_expr)
        .all()
    )

    exames_por_mes = [{"mes": m.mes, "total": m.total} for m in exames_rows]

    total = db.query(func.count(AsoRecord.id)).scalar() or 0

    status_asos = {
        "validos": total,
        "vencidos": 0,
        "a_vencer": 0,
    }

    return {
        "exames_por_mes": exames_por_mes,
        "status_asos": status_asos
    }
