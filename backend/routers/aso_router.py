from datetime import date, datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import AsoRecord

router = APIRouter(
    prefix="/aso",
    tags=["aso"]
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


# ---------- ENDPOINTS ----------

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


@router.get("/records", response_model=List[AsoOut])
def list_aso_records(db: Session = Depends(get_db)):
    """
    Lista todos os ASOs em ordem do mais recente para o mais antigo.
    """
    registros = db.query(AsoRecord).order_by(AsoRecord.created_at.desc()).all()
    return registros

@router.delete("/records/{record_id}")
def delete_aso_record(record_id: int, db: Session = Depends(get_db)):
    """
    Exclui um registro de ASO pelo ID.
    """
    # 1) Busca o registro
    aso = db.query(AsoRecord).filter(AsoRecord.id == record_id).first()

    if not aso:
        raise HTTPException(status_code=404, detail="Registro não encontrado")

    # 2) Exclui e confirma
    db.delete(aso)
    db.commit()

    return {"msg": "Registro excluído com sucesso"}

