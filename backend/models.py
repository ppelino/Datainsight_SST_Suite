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
from sqlalchemy import Column, Integer, String, Float, Date, Text
from database import Base  # o mesmo Base dos outros models

class LTCATRecord(Base):
    __tablename__ = "ltcat_records"
    __table_args__ = {"extend_existing": True}  # <- evita conflito se já existir no metadata

    id = Column(Integer, primary_key=True, index=True)

    empresa        = Column(String, nullable=False)
    cnpj           = Column(String, nullable=True)
    setor          = Column(String, nullable=False)
    funcao         = Column(String, nullable=False)
    ghe            = Column(String, nullable=True)

    agente         = Column(String, nullable=False)
    classificacao  = Column(String, nullable=False)

    fonte          = Column(String, nullable=True)
    meio           = Column(String, nullable=True)
    intensidade    = Column(String, nullable=True)
    unidade        = Column(String, nullable=True)

    jornada        = Column(Float, nullable=True)
    dias_semana    = Column(Integer, nullable=True)
    tempo_anos     = Column(Float, nullable=True)

    epi_eficaz     = Column(String, nullable=False, default="Sim")
    enquadramento  = Column(String, nullable=False, default="Sem enquadramento")

    data_avaliacao = Column(Date, nullable=True)
    responsavel    = Column(String, nullable=True)
    observacoes    = Column(Text, nullable=True)


# ============================================================
#  MÓDULO PGR / NR-01 – Registros simplificados
# ============================================================

class PGRRecord(Base):
    __tablename__ = "pgr_records"  # <-- tem que ser igual ao nome da tabela no Supabase

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Campos básicos
    empresa = Column(String, nullable=True)
    setor = Column(String, nullable=True)
    ghe = Column(String, nullable=True)          # ex: "GHE 01 – Soldagem"
    atividade = Column(String, nullable=True)    # descrição da atividade

    # Perigo / risco
    perigo = Column(String, nullable=True)       # fonte / situação perigosa
    risco = Column(String, nullable=True)        # nome do risco

    probabilidade = Column(Integer, nullable=True)  # 1 a 5
    severidade = Column(Integer, nullable=True)     # 1 a 5
    nivel_risco = Column(String, nullable=True)     # ex: "Baixo", "Médio", "Alto"

    # Controle
    medidas = Column(Text, nullable=True)        # medidas existentes
    plano_acao = Column(Text, nullable=True)     # o que fazer
    prazo = Column(Date, nullable=True)          # data limite
    responsavel = Column(String, nullable=True)  # responsável pela ação
    status = Column(String, nullable=True)       # ex: "Pendente", "Em andamento", "Concluído"

from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime,
    Text, ForeignKey, Date
)
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

# ... seus outros models (User, Company, Sector, Hazard, Risk, Action, AsoRecord, NR17Record, PGRRecord) ...

# ============================================================
#  MÓDULO LTCAT – Registros
# ============================================================

class LTCATRecord(Base):
    __tablename__ = "ltcat_records"  # crie essa tabela no Supabase com mesmo nome

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    empresa = Column(String, nullable=True)
    cnpj = Column(String, nullable=True)
    setor = Column(String, nullable=True)
    funcao = Column(String, nullable=True)
    ghe = Column(String, nullable=True)

    agente = Column(String, nullable=True)
    classificacao = Column(String, nullable=True)
    fonte = Column(String, nullable=True)
    meio = Column(String, nullable=True)
    intensidade = Column(String, nullable=True)
    unidade = Column(String, nullable=True)

    jornada_diaria = Column(String, nullable=True)
    dias_semana = Column(String, nullable=True)
    tempo_anos = Column(String, nullable=True)

    epi_eficaz = Column(String, nullable=True)
    enquadramento = Column(String, nullable=True)

    # guardo como texto pra não dar problema de parse
    data_avaliacao = Column(String, nullable=True)

    responsavel = Column(String, nullable=True)
    observacoes = Column(Text, nullable=True)




