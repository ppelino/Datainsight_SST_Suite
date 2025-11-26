from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import SessionLocal
from models import Company, Sector, Hazard, Risk, Action

router = APIRouter(
    prefix="/pgr",
    tags=["PGR / NR-01"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ============================
#  EMPRESAS
# ============================

@router.post("/companies")
def create_company(data: dict, db: Session = Depends(get_db)):
    company = Company(**data)
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


@router.get("/companies")
def list_companies(db: Session = Depends(get_db)):
    return db.query(Company).all()


# ============================
#  SETORES
# ============================

@router.post("/sectors")
def create_sector(data: dict, db: Session = Depends(get_db)):
    sector = Sector(**data)
    db.add(sector)
    db.commit()
    db.refresh(sector)
    return sector


@router.get("/sectors/by-company/{company_id}")
def list_sectors_by_company(company_id: int, db: Session = Depends(get_db)):
    return db.query(Sector).filter(Sector.company_id == company_id).all()


# ============================
#  PERIGOS (HAZARDS)
# ============================

@router.post("/hazards")
def create_hazard(data: dict, db: Session = Depends(get_db)):
    hazard = Hazard(**data)
    db.add(hazard)
    db.commit()
    db.refresh(hazard)
    return hazard


@router.get("/hazards/by-sector/{sector_id}")
def list_hazards_by_sector(sector_id: int, db: Session = Depends(get_db)):
    return db.query(Hazard).filter(Hazard.sector_id == sector_id).all()


# ============================
#  RISCOS
# ============================

@router.post("/risks")
def create_risk(data: dict, db: Session = Depends(get_db)):
    risk = Risk(**data)
    db.add(risk)
    db.commit()
    db.refresh(risk)
    return risk


@router.get("/risks/by-hazard/{hazard_id}")
def list_risks_by_hazard(hazard_id: int, db: Session = Depends(get_db)):
    return db.query(Risk).filter(Risk.hazard_id == hazard_id).all()


@router.put("/risks/{risk_id}")
def update_risk(risk_id: int, data: dict, db: Session = Depends(get_db)):
    """
    Atualiza probabilidade, severidade e medidas_existentes de um risco.
    """
    risk = db.query(Risk).filter(Risk.id == risk_id).first()
    if not risk:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Risco não encontrado."
        )

    for key, value in data.items():
        if hasattr(risk, key):
            setattr(risk, key, value)

    db.commit()
    db.refresh(risk)
    return risk


@router.delete("/risks/{risk_id}")
def delete_risk(risk_id: int, db: Session = Depends(get_db)):
    """
    Exclui um risco pelo ID.
    """
    risk = db.query(Risk).filter(Risk.id == risk_id).first()
    if not risk:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Risco não encontrado."
        )

    db.delete(risk)
    db.commit()
    return {"msg": "Risco excluído com sucesso."}


# ============================
#  AÇÕES DE CONTROLE
# ============================

@router.post("/actions")
def create_action(data: dict, db: Session = Depends(get_db)):
    action = Action(**data)
    db.add(action)
    db.commit()
    db.refresh(action)
    return action


@router.get("/actions/by-risk/{risk_id}")
def list_actions_by_risk(risk_id: int, db: Session = Depends(get_db)):
    return db.query(Action).filter(Action.risk_id == risk_id).all()
