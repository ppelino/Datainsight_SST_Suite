from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Company, Sector, Hazard, Risk, Action, User
from routers.auth_router import get_current_user

router = APIRouter(prefix="/pgr", tags=["PGR / NR-01"])


def get_or_404(db: Session, model, obj_id: int):
    obj = db.query(model).filter(model.id == obj_id).first()
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registro não encontrado."
        )
    return obj


def is_admin(user: User):
    return user.role == "admin"


def is_gestor(user: User):
    return user.role == "gestor"


def can_create_company(user: User):
    return user.role in ["admin", "gestor"]


def validate_company_access(company_id: int, current_user: User):
    if is_admin(current_user):
        return True

    if not company_id:
        return False

    return current_user.company_id == company_id


@router.post("/companies", status_code=status.HTTP_201_CREATED)
def create_company(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not can_create_company(current_user):
        raise HTTPException(
            status_code=403,
            detail="Sem permissão para criar empresas."
        )

    company = Company(**data)

    db.add(company)
    db.commit()
    db.refresh(company)

    if not is_admin(current_user):
        current_user.company_id = company.id
        db.commit()
        db.refresh(current_user)

    return company


@router.get("/companies")
def list_companies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if is_admin(current_user):
        return db.query(Company).order_by(Company.id.desc()).all()

    if not current_user.company_id:
        return []

    return (
        db.query(Company)
        .filter(Company.id == current_user.company_id)
        .all()
    )


@router.get("/companies/{company_id}")
def get_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not validate_company_access(company_id, current_user):
        raise HTTPException(status_code=403, detail="Sem permissão.")

    return get_or_404(db, Company, company_id)


@router.put("/companies/{company_id}")
def update_company(
    company_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not validate_company_access(company_id, current_user):
        raise HTTPException(status_code=403, detail="Sem permissão.")

    company = get_or_404(db, Company, company_id)

    for k, v in data.items():
        if hasattr(company, k):
            setattr(company, k, v)

    db.commit()
    db.refresh(company)

    return company


@router.delete("/companies/{company_id}")
def delete_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not is_admin(current_user):
        raise HTTPException(
            status_code=403,
            detail="Somente administrador pode excluir empresas."
        )

    company = get_or_404(db, Company, company_id)

    db.delete(company)
    db.commit()

    return {"msg": "Empresa excluída com sucesso."}


@router.post("/sectors", status_code=status.HTTP_201_CREATED)
def create_sector(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    company_id = data.get("company_id")

    if not validate_company_access(company_id, current_user):
        raise HTTPException(status_code=403, detail="Sem permissão.")

    sector = Sector(**data)

    db.add(sector)
    db.commit()
    db.refresh(sector)

    return sector


@router.get("/sectors/by-company/{company_id}")
def list_sectors_by_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not validate_company_access(company_id, current_user):
        raise HTTPException(status_code=403, detail="Sem permissão.")

    return db.query(Sector).filter(Sector.company_id == company_id).all()


@router.get("/sectors/{sector_id}")
def get_sector(
    sector_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sector = get_or_404(db, Sector, sector_id)

    if not validate_company_access(sector.company_id, current_user):
        raise HTTPException(status_code=403, detail="Sem permissão.")

    return sector


@router.put("/sectors/{sector_id}")
def update_sector(
    sector_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sector = get_or_404(db, Sector, sector_id)

    if not validate_company_access(sector.company_id, current_user):
        raise HTTPException(status_code=403, detail="Sem permissão.")

    for k, v in data.items():
        if hasattr(sector, k):
            setattr(sector, k, v)

    db.commit()
    db.refresh(sector)

    return sector


@router.delete("/sectors/{sector_id}")
def delete_sector(
    sector_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sector = get_or_404(db, Sector, sector_id)

    if not validate_company_access(sector.company_id, current_user):
        raise HTTPException(status_code=403, detail="Sem permissão.")

    db.delete(sector)
    db.commit()

    return {"msg": "Setor excluído com sucesso."}


@router.post("/hazards", status_code=status.HTTP_201_CREATED)
def create_hazard(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sector = get_or_404(db, Sector, data.get("sector_id"))

    if not validate_company_access(sector.company_id, current_user):
        raise HTTPException(status_code=403, detail="Sem permissão.")

    hazard = Hazard(**data)

    db.add(hazard)
    db.commit()
    db.refresh(hazard)

    return hazard


@router.get("/hazards/by-sector/{sector_id}")
def list_hazards_by_sector(
    sector_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sector = get_or_404(db, Sector, sector_id)

    if not validate_company_access(sector.company_id, current_user):
        raise HTTPException(status_code=403, detail="Sem permissão.")

    return db.query(Hazard).filter(Hazard.sector_id == sector_id).all()


@router.get("/hazards/{hazard_id}")
def get_hazard(
    hazard_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    hazard = get_or_404(db, Hazard, hazard_id)
    sector = get_or_404(db, Sector, hazard.sector_id)

    if not validate_company_access(sector.company_id, current_user):
        raise HTTPException(status_code=403, detail="Sem permissão.")

    return hazard


@router.put("/hazards/{hazard_id}")
def update_hazard(
    hazard_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    hazard = get_or_404(db, Hazard, hazard_id)
    sector = get_or_404(db, Sector, hazard.sector_id)

    if not validate_company_access(sector.company_id, current_user):
        raise HTTPException(status_code=403, detail="Sem permissão.")

    for k, v in data.items():
        if hasattr(hazard, k):
            setattr(hazard, k, v)

    db.commit()
    db.refresh(hazard)

    return hazard


@router.delete("/hazards/{hazard_id}")
def delete_hazard(
    hazard_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    hazard = get_or_404(db, Hazard, hazard_id)
    sector = get_or_404(db, Sector, hazard.sector_id)

    if not validate_company_access(sector.company_id, current_user):
        raise HTTPException(status_code=403, detail="Sem permissão.")

    db.delete(hazard)
    db.commit()

    return {"msg": "Perigo excluído com sucesso."}


@router.post("/risks", status_code=status.HTTP_201_CREATED)
def create_risk(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    hazard = get_or_404(db, Hazard, data.get("hazard_id"))
    sector = get_or_404(db, Sector, hazard.sector_id)

    if not validate_company_access(sector.company_id, current_user):
        raise HTTPException(status_code=403, detail="Sem permissão.")

    risk = Risk(**data)

    db.add(risk)
    db.commit()
    db.refresh(risk)

    return risk


@router.get("/risks/by-hazard/{hazard_id}")
def list_risks_by_hazard(
    hazard_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    hazard = get_or_404(db, Hazard, hazard_id)
    sector = get_or_404(db, Sector, hazard.sector_id)

    if not validate_company_access(sector.company_id, current_user):
        raise HTTPException(status_code=403, detail="Sem permissão.")

    return db.query(Risk).filter(Risk.hazard_id == hazard_id).all()


@router.get("/risks/{risk_id}")
def get_risk(
    risk_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    risk = get_or_404(db, Risk, risk_id)
    hazard = get_or_404(db, Hazard, risk.hazard_id)
    sector = get_or_404(db, Sector, hazard.sector_id)

    if not validate_company_access(sector.company_id, current_user):
        raise HTTPException(status_code=403, detail="Sem permissão.")

    return risk


@router.put("/risks/{risk_id}")
def update_risk(
    risk_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    risk = get_or_404(db, Risk, risk_id)
    hazard = get_or_404(db, Hazard, risk.hazard_id)
    sector = get_or_404(db, Sector, hazard.sector_id)

    if not validate_company_access(sector.company_id, current_user):
        raise HTTPException(status_code=403, detail="Sem permissão.")

    for k, v in data.items():
        if hasattr(risk, k):
            setattr(risk, k, v)

    db.commit()
    db.refresh(risk)

    return risk


@router.delete("/risks/{risk_id}")
def delete_risk(
    risk_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    risk = get_or_404(db, Risk, risk_id)
    hazard = get_or_404(db, Hazard, risk.hazard_id)
    sector = get_or_404(db, Sector, hazard.sector_id)

    if not validate_company_access(sector.company_id, current_user):
        raise HTTPException(status_code=403, detail="Sem permissão.")

    db.delete(risk)
    db.commit()

    return {"msg": "Risco excluído com sucesso."}


@router.post("/actions", status_code=status.HTTP_201_CREATED)
def create_action(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    risk = get_or_404(db, Risk, data.get("risk_id"))
    hazard = get_or_404(db, Hazard, risk.hazard_id)
    sector = get_or_404(db, Sector, hazard.sector_id)

    if not validate_company_access(sector.company_id, current_user):
        raise HTTPException(status_code=403, detail="Sem permissão.")

    action = Action(**data)

    db.add(action)
    db.commit()
    db.refresh(action)

    return action


@router.get("/actions/by-risk/{risk_id}")
def list_actions_by_risk(
    risk_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    risk = get_or_404(db, Risk, risk_id)
    hazard = get_or_404(db, Hazard, risk.hazard_id)
    sector = get_or_404(db, Sector, hazard.sector_id)

    if not validate_company_access(sector.company_id, current_user):
        raise HTTPException(status_code=403, detail="Sem permissão.")

    return db.query(Action).filter(Action.risk_id == risk_id).all()


@router.get("/actions/{action_id}")
def get_action(
    action_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    action = get_or_404(db, Action, action_id)
    risk = get_or_404(db, Risk, action.risk_id)
    hazard = get_or_404(db, Hazard, risk.hazard_id)
    sector = get_or_404(db, Sector, hazard.sector_id)

    if not validate_company_access(sector.company_id, current_user):
        raise HTTPException(status_code=403, detail="Sem permissão.")

    return action


@router.put("/actions/{action_id}")
def update_action(
    action_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    action = get_or_404(db, Action, action_id)
    risk = get_or_404(db, Risk, action.risk_id)
    hazard = get_or_404(db, Hazard, risk.hazard_id)
    sector = get_or_404(db, Sector, hazard.sector_id)

    if not validate_company_access(sector.company_id, current_user):
        raise HTTPException(status_code=403, detail="Sem permissão.")

    for k, v in data.items():
        if hasattr(action, k):
            setattr(action, k, v)

    db.commit()
    db.refresh(action)

    return action


@router.delete("/actions/{action_id}")
def delete_action(
    action_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    action = get_or_404(db, Action, action_id)
    risk = get_or_404(db, Risk, action.risk_id)
    hazard = get_or_404(db, Hazard, risk.hazard_id)
    sector = get_or_404(db, Sector, hazard.sector_id)

    if not validate_company_access(sector.company_id, current_user):
        raise HTTPException(status_code=403, detail="Sem permissão.")

    db.delete(action)
    db.commit()

    return {"msg": "Ação excluída com sucesso."}
