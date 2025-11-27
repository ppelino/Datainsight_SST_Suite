from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import SessionLocal
from models import LTCATRecord

router = APIRouter(
    prefix="/ltcat",
    tags=["LTCAT"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/records")
def list_ltcat_records(db: Session = Depends(get_db)):
    """
    Lista todos os registros LTCAT.
    """
    return db.query(LTCATRecord).order_by(LTCATRecord.id).all()


@router.post("/records", status_code=status.HTTP_201_CREATED)
def create_ltcat_record(data: dict, db: Session = Depends(get_db)):
    """
    Cria um novo registro LTCAT.
    """
    record = LTCATRecord(**data)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.put("/records/{record_id}")
def update_ltcat_record(record_id: int, data: dict, db: Session = Depends(get_db)):
    """
    Atualiza um registro LTCAT existente.
    """
    record = db.query(LTCATRecord).filter(LTCATRecord.id == record_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registro LTCAT não encontrado."
        )

    for key, value in data.items():
        if hasattr(record, key):
            setattr(record, key, value)

    db.commit()
    db.refresh(record)
    return record


@router.delete("/records/{record_id}")
def delete_ltcat_record(record_id: int, db: Session = Depends(get_db)):
    """
    Exclui um registro LTCAT.
    """
    record = db.query(LTCATRecord).filter(LTCATRecord.id == record_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registro LTCAT não encontrado."
        )

    db.delete(record)
    db.commit()
    return {"msg": "Registro LTCAT excluído com sucesso."}
