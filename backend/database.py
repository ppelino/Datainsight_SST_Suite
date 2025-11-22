from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# Se DB_URL não existir no ambiente, usa SQLite local automaticamente.
DB_URL = os.environ.get("DB_URL", "sqlite:///./datainsight_sst.db")

# Config extra para SQLite (necessário)
connect_args = {"check_same_thread": False} if DB_URL.startswith("sqlite") else {}

engine = create_engine(DB_URL, connect_args=connect_args)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


