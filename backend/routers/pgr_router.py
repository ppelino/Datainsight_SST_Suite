from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Company, Sector, Hazard, Risk, Action

router = APIRouter(
    prefix="/pgr",
    tags=["PGR / NR-01"]
)

# ============================================================
#  Helpers genéricos
# ============================================================

def get_or_404(db: Session, model, obj_id: int):
    obj = db.query(model).filter(model.id == obj_id).first()
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registro não encontrado."
        )
    return obj


# ============================================================
#  EMPRESAS
# ============================================================

@router.post("/companies", status_code=status.HTTP_201_CREATED)
def create_company(data: dict, db: Session = Depends(get_db)):
    company = Company(**data)
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


@router.get("/companies")
def list_companies(db: Session = Depends(get_db)):
    return db.query(Company).all()


@router.get("/companies/{company_id}")
def get_company(company_id: int, db: Session = Depends(get_db)):
    return get_or_404(db, Company, company_id)


@router.put("/companies/{company_id}")
def update_company(company_id: int, data: dict, db: Session = Depends(get_db)):
    company = get_or_404(db, Company, company_id)
    for k, v in data.items():
        if hasattr(company, k):
            setattr(company, k, v)
    db.commit()
    db.refresh(company)
    return company


@router.delete("/companies/{company_id}")
def delete_company(company_id: int, db: Session = Depends(get_db)):
    company = get_or_404(db, Company, company_id)
    db.delete(company)
    db.commit()
    return {"msg": "Empresa excluída com sucesso."}


# ============================================================
#  SETORES
# ============================================================

@router.post("/sectors", status_code=status.HTTP_201_CREATED)
def create_sector(data: dict, db: Session = Depends(get_db)):
    sector = Sector(**data)
    db.add(sector)
    db.commit()
    db.refresh(sector)
    return sector


@router.get("/sectors/by-company/{company_id}")
def list_sectors_by_company(company_id: int, db: Session = Depends(get_db)):
    return db.query(Sector).filter(Sector.company_id == company_id).all()


@router.get("/sectors/{sector_id}")
def get_sector(sector_id: int, db: Session = Depends(get_db)):
    return get_or_404(db, Sector, sector_id)


@router.put("/sectors/{sector_id}")
def update_sector(sector_id: int, data: dict, db: Session = Depends(get_db)):
    sector = get_or_404(db, Sector, sector_id)
    for k, v in data.items():
        if hasattr(sector, k):
            setattr(sector, k, v)
    db.commit()
    db.refresh(sector)
    return sector


@router.delete("/sectors/{sector_id}")
def delete_sector(sector_id: int, db: Session = Depends(get_db)):
    sector = get_or_404(db, Sector, sector_id)
    db.delete(sector)
    db.commit()
    return {"msg": "Setor excluído com sucesso."}


# ============================================================
#  PERIGOS (HAZARDS)
# ============================================================

@router.post("/hazards", status_code=status.HTTP_201_CREATED)
def create_hazard(data: dict, db: Session = Depends(get_db)):
    hazard = Hazard(**data)
    db.add(hazard)
    db.commit()
    db.refresh(hazard)
    return hazard


@router.get("/hazards/by-sector/{sector_id}")
def list_hazards_by_sector(sector_id: int, db: Session = Depends(get_db)):
    return db.query(Hazard).filter(Hazard.sector_id == sector_id).all()


@router.get("/hazards/{hazard_id}")
def get_hazard(hazard_id: int, db: Session = Depends(get_db)):
    return get_or_404(db, Hazard, hazard_id)


@router.put("/hazards/{hazard_id}")
def update_hazard(hazard_id: int, data: dict, db: Session = Depends(get_db)):
    hazard = get_or_404(db, Hazard, hazard_id)
    for k, v in data.items():
        if hasattr(hazard, k):
            setattr(hazard, k, v)
    db.commit()
    db.refresh(hazard)
    return hazard


@router.delete("/hazards/{hazard_id}")
def delete_hazard(hazard_id: int, db: Session = Depends(get_db)):
    hazard = get_or_404(db, Hazard, hazard_id)
    db.delete(hazard)
    db.commit()
    return {"msg": "Perigo excluído com sucesso."}


# ============================================================
#  RISCOS
# ============================================================

@router.post("/risks", status_code=status.HTTP_201_CREATED)
def create_risk(data: dict, db: Session = Depends(get_db)):
    risk = Risk(**data)
    db.add(risk)
    db.commit()
    db.refresh(risk)
    return risk


@router.get("/risks/by-hazard/{hazard_id}")
def list_risks_by_hazard(hazard_id: int, db: Session = Depends(get_db)):
    return db.query(Risk).filter(Risk.hazard_id == hazard_id).all()


@router.get("/risks/{risk_id}")
def get_risk(risk_id: int, db: Session = Depends(get_db)):
    return get_or_404(db, Risk, risk_id)


@router.put("/risks/{risk_id}")
def update_risk(risk_id: int, data: dict, db: Session = Depends(get_db)):
    risk = get_or_404(db, Risk, risk_id)
    for k, v in data.items():
        if hasattr(risk, k):
            setattr(risk, k, v)
    db.commit()
    db.refresh(risk)
    return risk


@router.delete("/risks/{risk_id}")
def delete_risk(risk_id: int, db: Session = Depends(get_db)):
    risk = get_or_404(db, Risk, risk_id)
    db.delete(risk)
    db.commit()
    return {"msg": "Risco excluído com sucesso."}


# ============================================================
#  AÇÕES DE CONTROLE
# ============================================================

@router.post("/actions", status_code=status.HTTP_201_CREATED)
def create_action(data: dict, db: Session = Depends(get_db)):
    action = Action(**data)
    db.add(action)
    db.commit()
    db.refresh(action)
    return action


@router.get("/actions/by-risk/{risk_id}")
def list_actions_by_risk(risk_id: int, db: Session = Depends(get_db)):
    return db.query(Action).filter(Action.risk_id == risk_id).all()


@router.get("/actions/{action_id}")
def get_action(action_id: int, db: Session = Depends(get_db)):
    return get_or_404(db, Action, action_id)


@router.put("/actions/{action_id}")
def update_action(action_id: int, data: dict, db: Session = Depends(get_db)):
    action = get_or_404(db, Action, action_id)
    for k, v in data.items():
        if hasattr(action, k):
            setattr(action, k, v)
    db.commit()
    db.refresh(action)
    return action


@router.delete("/actions/{action_id}")
def delete_action(action_id: int, db: Session = Depends(get_db)):
    action = get_or_404(db, Action, action_id)
    db.delete(action)
    db.commit()
    return {"msg": "Ação excluída com sucesso."}
