from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import NR17Record, User
from routers.auth_router import get_current_user

router = APIRouter(
    prefix="/nr17",
    tags=["NR-17"]
)


def base_query_for_user(db: Session, current_user: User):
    query = db.query(NR17Record)

    if current_user.role == "admin":
        return query

    if not current_user.company_id:
        return query.filter(NR17Record.company_id == -1)

    return query.filter(NR17Record.company_id == current_user.company_id)


@router.get("/records")
def list_nr17_records(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return (
        base_query_for_user(db, current_user)
        .order_by(NR17Record.id.asc())
        .all()
    )


@router.post("/records", status_code=status.HTTP_201_CREATED)
def create_nr17_record(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    data["company_id"] = current_user.company_id

    record = NR17Record(**data)

    db.add(record)
    db.commit()
    db.refresh(record)

    return record


@router.put("/records/{record_id}")
def update_nr17_record(
    record_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    record = (
        base_query_for_user(db, current_user)
        .filter(NR17Record.id == record_id)
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Avaliação NR-17 não encontrada ou sem permissão."
        )

    data.pop("company_id", None)

    for key, value in data.items():
        if hasattr(record, key):
            setattr(record, key, value)

    db.commit()
    db.refresh(record)

    return record


@router.delete("/records/{record_id}")
def delete_nr17_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    record = (
        base_query_for_user(db, current_user)
        .filter(NR17Record.id == record_id)
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Avaliação NR-17 não encontrada ou sem permissão."
        )

    db.delete(record)
    db.commit()

    return {"msg": "Avaliação NR-17 excluída com sucesso."}
