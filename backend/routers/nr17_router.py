from datetime import date
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import NR17Record

router = APIRouter(
    prefix="/nr17",
    tags=["nr17"],
)

# ---------- Schemas ----------

class NR17Create(BaseModel):
    empresa: Optional[str] = None
    setor: str
    funcao: str
    trabalhador: Optional[str] = None
    tipo_posto: str
    data_avaliacao: date
    risco: str
    score: int
    observacoes: Optional[str] = None


class NR17Out(NR17Create):
    id: int

    class Config:
        orm_mode = True


# ---------- Endpoints ----------

@router.post("/records", response_model=NR17Out)
def create_nr17_record(payload: NR17Create, db: Session = Depends(get_db)):
    try:
        record = NR17Record(
            empresa=payload.empresa,
            setor=payload.setor,
            funcao=payload.funcao,
            trabalhador=payload.trabalhador,
            tipo_posto=payload.tipo_posto,
            data_avaliacao=payload.data_avaliacao,
            risco=payload.risco,
            score=payload.score,
            observacoes=payload.observacoes,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/records", response_model=List[NR17Out])
def list_nr17_records(db: Session = Depends(get_db)):
    records = (
        db.query(NR17Record)
        .order_by(NR17Record.data_avaliacao.desc(), NR17Record.id.desc())
        .all()
    )
    return records
