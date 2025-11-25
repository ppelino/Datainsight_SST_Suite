from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime,
    Text, ForeignKey, Date
)
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


# ============================================================
#  USUÁRIOS DO SISTEMA
# ============================================================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    name = Column(String, nullable=False)

    # admin  -> você, super administrador
    # gestor -> dono da empresa contratante
    # user   -> funcionário
    role = Column(String, default="user")

    # free / pro / enterprise
    plan = Column(String, default="free")

    company_id = Column(Integer, nullable=True)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ============================================================
#  MÓDULO PGR / NR-01
# ============================================================

# 1. Empresas
class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    cnpj = Column(String)
    endereco = Column(String)
    atividade = Column(String)
    grau_risco = Column(Integer)
    criado_em = Column(DateTime, default=datetime.utcnow)

    sectors = relationship("Sector", back_populates="company")


# 2. Setores
class Sector(Base):
    __tablename__ = "sectors"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    nome = Column(String, nullable=False)
    descricao = Column(Text)

    company = relationship("Company", back_populates="sectors")
    hazards = relationship("Hazard", back_populates="sector")


# 3. Perigos (Hazards)
class Hazard(Base):
    __tablename__ = "hazards"

    id = Column(Integer, primary_key=True, index=True)
    sector_id = Column(Integer, ForeignKey("sectors.id"))
    nome = Column(String, nullable=False)
    agente = Column(String)
    fonte = Column(String)
    descricao = Column(Text)

    sector = relationship("Sector", back_populates="hazards")
    risks = relationship("Risk", back_populates="hazard")


# 4. Riscos
class Risk(Base):
    __tablename__ = "risks"

    id = Column(Integer, primary_key=True, index=True)
    hazard_id = Column(Integer, ForeignKey("hazards.id"))
    probabilidade = Column(Integer)
    severidade = Column(Integer)
    medidas_existentes = Column(Text)

    hazard = relationship("Hazard", back_populates="risks")
    actions = relationship("Action", back_populates="risk")


# 5. Ações de Controle
class Action(Base):
    __tablename__ = "actions"

    id = Column(Integer, primary_key=True, index=True)
    risk_id = Column(Integer, ForeignKey("risks.id"))
    recomendacao = Column(Text)
    tipo = Column(String)
    prazo = Column(Date)
    responsavel = Column(String)
    status = Column(String, default="pendente")

    risk = relationship("Risk", back_populates="actions")

# ============================================================
#  MÓDULO PCMSO / ASO
# ============================================================

class AsoRecord(Base):
    __tablename__ = "aso_records"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    nome = Column(String, nullable=False)
    cpf = Column(String, nullable=False)
    funcao = Column(String, nullable=False)
    setor = Column(String, nullable=False)

    tipo_exame = Column(String, nullable=False)
    data_exame = Column(Date, nullable=False)

    medico = Column(String)
    resultado = Column(String, nullable=False)

# ============================================================
#  MÓDULO NR-17 – Avaliações Ergonômicas
# ============================================================

class NR17Record(Base):
    __tablename__ = "nr17_records"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    empresa = Column(String)
    setor = Column(String)
    funcao = Column(String)
    trabalhador = Column(String)
    tipo_posto = Column(String)
    data_avaliacao = Column(Date)

    risco = Column(String)
    score = Column(Integer)

    observacoes = Column(Text)



