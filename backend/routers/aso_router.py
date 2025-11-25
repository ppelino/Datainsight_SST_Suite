from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import date

from database import get_db
from models import AsoRecord

router = APIRouter(
    prefix="/aso",
    tags=["aso"]
)


# ====== Schemas Pydantic ======

class AsoCreate(BaseModel):
    nome: str
    cpf: str
    funcao: str
    setor: str | None = None
    tipo_exame: str
    data_exame: date        # recebe "AAAA-MM-DD" do front e converte
    medico: str | None = None
    resultado: str


class AsoOut(BaseModel):
    id: int
    nome: str
    cpf: str
    funcao: str
    setor: str | None
    tipo_exame: str
    data_exame: date | None
    medico: str | None
    resultado: str
    created_at: date | None

    class Config:
        from_attributes = True  # para transformar AsoRecord -> AsoOut


# ====== Endpoints ======

@router.post("/records", response_model=AsoOut)
def create_aso(aso: AsoCreate, db: Session = Depends(get_db)):
    """Cria um novo registro de ASO no banco (tabela aso_records)."""
    registro = AsoRecord(
        nome=aso.nome,
        cpf=aso.cpf,
        funcao=aso.funcao,
        setor=aso.setor,
        tipo_exame=aso.tipo_exame,
        data_exame=aso.data_exame,
        medico=aso.medico,
        resultado=aso.resultado,
    )
    db.add(registro)
    db.commit()
    db.refresh(registro)
    return registro


@router.get("/records", response_model=list[AsoOut])
def list_aso(db: Session = Depends(get_db)):
    """Lista todos os ASOs, do mais recente para o mais antigo."""
    registros = (
        db.query(AsoRecord)
        .order_by(AsoRecord.created_at.desc())
        .all()
    )
    return registros
