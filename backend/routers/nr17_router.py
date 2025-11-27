from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import SessionLocal
from models import NR17Record

router = APIRouter(
    prefix="/nr17",
    tags=["NR-17"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ============================
#  LISTAR REGISTROS
# ============================
@router.get("/records")
def list_nr17_records(db: Session = Depends(get_db)):
    """
    Lista todas as avaliações NR-17.
    """
    return db.query(NR17Record).order_by(NR17Record.id.asc()).all()


# ============================
#  CRIAR REGISTRO
# ============================
@router.post("/records", status_code=status.HTTP_201_CREATED)
def create_nr17_record(data: dict, db: Session = Depends(get_db)):
    """
    Cria uma nova avaliação NR-17.
    Espera JSON com:
    empresa, setor, funcao, trabalhador, tipo_posto,
    data_avaliacao, risco, score, observacoes.
    """
    record = NR17Record(**data)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


# ============================
#  ATUALIZAR REGISTRO
# ============================
@router.put("/records/{record_id}")
def update_nr17_record(record_id: int, data: dict, db: Session = Depends(get_db)):
    """
    Atualiza uma avaliação NR-17 existente.
    """
    record = db.query(NR17Record).filter(NR17Record.id == record_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Avaliação NR-17 não encontrada."
        )

    for key, value in data.items():
        if hasattr(record, key):
            setattr(record, key, value)

    db.commit()
    db.refresh(record)
    return record


# ============================
#  EXCLUIR REGISTRO
# ============================
@router.delete("/records/{record_id}")
def delete_nr17_record(record_id: int, db: Session = Depends(get_db)):
    """
    Exclui uma avaliação NR-17 pelo ID.
    """
    record = db.query(NR17Record).filter(NR17Record.id == record_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Avaliação NR-17 não encontrada."
        )

    db.delete(record)
    db.commit()
    return {"msg": "Avaliação NR-17 excluída com sucesso."}
