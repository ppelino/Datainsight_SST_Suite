from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import NR17Record, User, Company
from routers.auth_router import get_current_user

router = APIRouter(
    prefix="/nr17",
    tags=["NR-17"]
)


def is_admin(user: User):
    return user.role == "admin"


def get_default_company_id(db: Session, current_user: User):
    if is_admin(current_user):
        return current_user.company_id

    company = (
        db.query(Company)
        .filter(Company.owner_id == current_user.id)
        .order_by(Company.id.desc())
        .first()
    )

    return company.id if company else None


def validate_company_access(db: Session, company_id: int, current_user: User):
    if is_admin(current_user):
        return True

    if not company_id:
        return False

    company = (
        db.query(Company)
        .filter(
            Company.id == company_id,
            Company.owner_id == current_user.id
        )
        .first()
    )

    return company is not None


def base_query_for_user(db: Session, current_user: User):
    query = db.query(NR17Record)

    if is_admin(current_user):
        return query

    owned_company_ids = (
        db.query(Company.id)
        .filter(Company.owner_id == current_user.id)
        .subquery()
    )

    return query.filter(NR17Record.company_id.in_(owned_company_ids))


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
    company_id = data.get("company_id") or get_default_company_id(db, current_user)

    if not company_id:
        raise HTTPException(
            status_code=400,
            detail="Nenhuma empresa vinculada ao usuário. Cadastre uma empresa primeiro."
        )

    if not validate_company_access(db, company_id, current_user):
        raise HTTPException(
            status_code=403,
            detail="Sem permissão para registrar NR-17 nesta empresa."
        )

    data["company_id"] = company_id

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
