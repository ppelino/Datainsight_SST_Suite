from datetime import date, datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func  # para agregações no dashboard

from database import get_db
from models import AsoRecord


router = APIRouter(
    prefix="/aso",
    tags=["aso"],
)

# ---------- SCHEMAS Pydantic ----------

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


# ---------- CRIAR ----------

@router.post("/records", response_model=AsoOut)
def create_aso_record(payload: AsoCreate, db: Session = Depends(get_db)):
    """
    Cria um registro de ASO na tabela aso_records.
    """
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


# ---------- LISTAR ----------

@router.get("/records", response_model=List[AsoOut])
def list_aso_records(db: Session = Depends(get_db)):
    """
    Lista todos os ASOs em ordem do mais recente para o mais antigo.
    """
    registros = db.query(AsoRecord).order_by(AsoRecord.created_at.desc()).all()
    return registros


# ---------- DELETAR (VERSÃO FINAL) ----------

@router.delete("/records/{record_id}", response_model=dict)
def delete_aso_record(record_id: int, db: Session = Depends(get_db)):
    """
    Exclui um registro de ASO pelo ID.
    Mesmo que nenhuma linha seja afetada (registro já não exista),
    retorna 200 para o frontend.
    """
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
        print("Erro ao excluir ASO:", e)
        raise HTTPException(status_code=500, detail="Erro ao excluir registro no banco.")


# ============================================================
#  DASHBOARD PCMSO / ASO
# ============================================================

@router.get("/dashboard/pcmsos")
def dashboard_pcmsos(db: Session = Depends(get_db)):
    """
    Dados agregados para o dashboard de PCMSO / ASO.

    Caminho completo na API:
      /api/aso/dashboard/pcmsos
    (API_BASE já tem /api)
    """

    # 1) Exames por mês (MM/YYYY)
    #    Ex.: "11/2025", "12/2025", etc.
    exames_rows = (
        db.query(
            func.to_char(AsoRecord.data_exame, "MM/YYYY").label("mes"),
            func.count(AsoRecord.id).label("total"),
        )
        .group_by(func.to_char(AsoRecord.data_exame, "MM/YYYY"))
        .order_by(func.to_char(AsoRecord.data_exame, "MM/YYYY"))
        .all()
    )

    exames_por_mes = [
        {"mes": row.mes, "total": row.total}
        for row in exames_rows
    ]

    # 2) Status dos ASOs
    # Por enquanto, lógica simples:
    # - todos vão como "válidos"
    total_asos = db.query(func.count(AsoRecord.id)).scalar() or 0

    status_asos = {
        "validos": total_asos,
        "vencidos": 0,
        "a_vencer": 0,
    }

    return {
        "exames_por_mes": exames_por_mes,
        "status_asos": status_asos,
    }
