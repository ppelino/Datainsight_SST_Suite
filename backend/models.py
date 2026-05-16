from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime,
    Text, ForeignKey, Date, Float
)
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    name = Column(String, nullable=False)

    role = Column(String, default="user")
    plan = Column(String, default="free")
    plan_expires_at = Column(Date, nullable=True)

    company_id = Column(Integer, nullable=True)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)

    # NOVO
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    name = Column(String, nullable=False)
    cnpj = Column(String)
    endereco = Column(String)
    atividade = Column(String)
    grau_risco = Column(Integer)
    criado_em = Column(DateTime, default=datetime.utcnow)

    sectors = relationship("Sector", back_populates="company")


class Sector(Base):
    __tablename__ = "sectors"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    nome = Column(String, nullable=False)
    descricao = Column(Text)

    company = relationship("Company", back_populates="sectors")
    hazards = relationship("Hazard", back_populates="sector")


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


class Risk(Base):
    __tablename__ = "risks"

    id = Column(Integer, primary_key=True, index=True)
    hazard_id = Column(Integer, ForeignKey("hazards.id"))
    probabilidade = Column(Integer)
    severidade = Column(Integer)
    medidas_existentes = Column(Text)

    hazard = relationship("Hazard", back_populates="risks")
    actions = relationship("Action", back_populates="risk")


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


class AsoRecord(Base):
    __tablename__ = "aso_records"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    company_id = Column(Integer, nullable=True)

    nome = Column(String, nullable=False)
    cpf = Column(String, nullable=False)
    funcao = Column(String, nullable=False)
    setor = Column(String, nullable=False)

    tipo_exame = Column(String, nullable=False)
    data_exame = Column(Date, nullable=False)

    medico = Column(String)
    resultado = Column(String, nullable=False)


class NR17Record(Base):
    __tablename__ = "nr17_records"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    company_id = Column(Integer, nullable=True)

    empresa = Column(String)
    setor = Column(String)
    funcao = Column(String)
    trabalhador = Column(String)
    tipo_posto = Column(String)
    data_avaliacao = Column(Date)

    risco = Column(String)
    score = Column(Integer)

    observacoes = Column(Text)


class LTCATRecord(Base):
    __tablename__ = "ltcat_records"

    id = Column(Integer, primary_key=True, index=True)

    company_id = Column(Integer, nullable=True)

    empresa = Column(String, nullable=False)
    cnpj = Column(String, nullable=True)
    setor = Column(String, nullable=False)
    funcao = Column(String, nullable=False)
    ghe = Column(String, nullable=True)

    agente = Column(String, nullable=False)
    classificacao = Column(String, nullable=False)

    fonte = Column(String, nullable=True)
    meio = Column(String, nullable=True)
    intensidade = Column(String, nullable=True)
    unidade = Column(String, nullable=True)

    jornada = Column(Float, nullable=True)
    dias_semana = Column(Integer, nullable=True)
    tempo_anos = Column(Float, nullable=True)

    epi_eficaz = Column(String, nullable=False, default="Sim")
    enquadramento = Column(String, nullable=False, default="Sem enquadramento")

    data_avaliacao = Column(Date, nullable=True)
    responsavel = Column(String, nullable=True)
    observacoes = Column(Text, nullable=True)


class PGRRecord(Base):
    __tablename__ = "pgr_records"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    company_id = Column(Integer, nullable=True)

    empresa = Column(String, nullable=True)
    setor = Column(String, nullable=True)
    ghe = Column(String, nullable=True)
    atividade = Column(String, nullable=True)

    perigo = Column(String, nullable=True)
    risco = Column(String, nullable=True)

    probabilidade = Column(Integer, nullable=True)
    severidade = Column(Integer, nullable=True)
    nivel_risco = Column(String, nullable=True)

    medidas = Column(Text, nullable=True)
    plano_acao = Column(Text, nullable=True)
    prazo = Column(Date, nullable=True)
    responsavel = Column(String, nullable=True)
    status = Column(String, nullable=True)
