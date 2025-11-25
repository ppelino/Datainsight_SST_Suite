from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine

# importa os routers
from routers import auth_router
from routers.pgr_router import router as pgr_router          # PGR / NR-01
from routers.aso_router import router as aso_router          # PCMSO / ASO
from routers.nr17_router import router as nr17_router      # NR-17

app = FastAPI(title="Datainsight SST Suite")

# ============================================================
# CORS – liberar front (Netlify) + API Render + local
# ============================================================
origins = [
    "https://datainsightsstsuite.netlify.app",     # frontend em produção
    "https://datainsight-sst-suite.onrender.com",  # API em produção
    "http://localhost:5500",                       # dev local
    "http://127.0.0.1:5500",
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

# Como as tabelas já estão no Supabase, não executamos create_all()
# Base.metadata.create_all(bind=engine)
print("Tabelas já estão no Supabase — create_all desativado.")


# ============================================================
# ROTAS PRINCIPAIS
# ============================================================

@app.get("/")
def home():
    return {"msg": "API funcionando!"}

# login / cadastro / auth
app.include_router(auth_router.router)

# módulo PGR / NR-01
app.include_router(pgr_router)

# módulo PCMSO / ASO
app.include_router(aso_router)

# rotas da NR-17
app.include_router(nr17_router)

@app.get("/health")
def health():
    return {"status": "OK"}

