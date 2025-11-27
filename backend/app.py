from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from models import *  # ou import LTCATRecord, NR17Record, etc.

Base.metadata.create_all(bind=engine)


# Routers
from routers.auth_router import router as auth_router       # login / usuários
from routers.pgr_router import router as pgr_router         # PGR / NR-01
from routers.aso_router import router as aso_router         # PCMSO / ASO
from routers.nr17_router import router as nr17_router       # NR-17
from routers.ltcat_router import router as ltcat_router     # LTCAT

app = FastAPI(
    title="Datainsight SST Suite",
    version="1.0.0",
)


# ============================================================
# CORS – liberar front (Netlify) + local
# ============================================================
origins = [
    "http://localhost:5500",
    "http://127.0.0.1:5500",

    # FRONT DA SUITE NO NETLIFY
    "https://datainsightsstsuite.netlify.app",
    "https://datainsightsstsuite.netlify.app/",  # variação com barra
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# DATABASE
# ============================================================
# As tabelas já existem no Supabase → NÃO rodar create_all()
# Base.metadata.create_all(bind=engine)
print("Tabelas já estão no Supabase — create_all desativado.")


# ============================================================
# ROTAS PRINCIPAIS
# ============================================================

@app.get("/")
def home():
    return {"msg": "API funcionando!"}


@app.get("/health")
def health():
    return {"status": "OK"}


# login / cadastro / auth
app.include_router(auth_router)

# módulo PGR / NR-01
app.include_router(pgr_router)

# módulo PCMSO / ASO
app.include_router(aso_router)

# módulo NR-17
app.include_router(nr17_router)

# módulo LTCAT
app.include_router(ltcat_router)


