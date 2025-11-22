from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    name = Column(String, nullable=False)

    # Papel do usuário no sistema:
    #  - admin  -> você / super administrador
    #  - gestor -> cliente responsável pela conta da empresa
    #  - user   -> colaborador comum
    role = Column(String, default="user")

    # Plano de assinatura:
    #  - free
    #  - pro
    #  - enterprise
    plan = Column(String, default="free")

    # ID da empresa (quando você criar a tabela de empresas depois)
    company_id = Column(Integer, nullable=True)

    # Se o usuário está ativo (pode logar)
    is_active = Column(Boolean, default=True)

    # Para controle de quando a conta foi criada
    created_at = Column(DateTime, default=datetime.utcnow)



