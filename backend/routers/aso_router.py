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
        # Log simples no servidor
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
async def delete_aso_record(record_id: int, db: Session = Depends(get_db)):
    ...

    try:
        query = "DELETE FROM aso_records WHERE id = %s"
        session = engine.raw_connection()
        cursor = session.cursor()
        cursor.execute(query, (record_id,))
        session.commit()
        cursor.close()
        session.close()

        return {"msg": "Registro excluído com sucesso"}
    except Exception as e:
        print("Erro ao excluir ASO:", e)
        raise HTTPException(status_code=500, detail="Erro ao excluir registro")
