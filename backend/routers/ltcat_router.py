from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import LTCATRecord, User
from routers.auth_router import get_current_user

router = APIRouter(
    prefix="/ltcat",
    tags=["LTCAT"]
)


def base_query_for_user(db: Session, current_user: User):
    query = db.query(LTCATRecord)

    if current_user.role == "admin":
        return query

    if not current_user.company_id:
        return query.filter(LTCATRecord.company_id == -1)

    return query.filter(LTCATRecord.company_id == current_user.company_id)


@router.get("/records")
def list_ltcat_records(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return (
        base_query_for_user(db, current_user)
        .order_by(LTCATRecord.id.asc())
        .all()
    )


@router.post("/records", status_code=status.HTTP_201_CREATED)
def create_ltcat_record(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    data["company_id"] = current_user.company_id

    record = LTCATRecord(**data)

    db.add(record)
    db.commit()
    db.refresh(record)

    return record


@router.put("/records/{record_id}")
def update_ltcat_record(
    record_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    record = (
        base_query_for_user(db, current_user)
        .filter(LTCATRecord.id == record_id)
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registro LTCAT não encontrado ou sem permissão."
        )

    data.pop("company_id", None)

    for key, value in data.items():
        if hasattr(record, key):
            setattr(record, key, value)

    db.commit()
    db.refresh(record)

    return record


@router.delete("/records/{record_id}")
def delete_ltcat_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    record = (
        base_query_for_user(db, current_user)
        .filter(LTCATRecord.id == record_id)
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registro LTCAT não encontrado ou sem permissão."
        )

    db.delete(record)
    db.commit()

    return {"msg": "Registro LTCAT excluído com sucesso."}
