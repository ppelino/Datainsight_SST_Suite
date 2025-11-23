from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine

# importa os routers
from routers import auth_router
from routers.pgr_router import router as pgr_router   # ➜ ADICIONADO


app = FastAPI(title="Datainsight SST Suite")

# ⚙️ CORS - libera o front da Netlify e testes locais
origins = [
    "https://datainsightsstsuite.netlify.app",     # seu frontend em produção
    "https://datainsight-sst-suite.onrender.com",  # a própria API
    "http://localhost:5500",                       # ambiente local
    "http://127.0.0.1:5500",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🗄️ cria tabelas caso ainda não existam
# Base.metadata.create_all(bind=engine)
print("Tabelas já estão no Supabase — create_all desativado.")



# ============================================================
# ROTAS
# ============================================================

@app.get("/")
def home():
    return {"msg": "API funcionando!"}

# rotas de autenticação
app.include_router(auth_router.router)

# rotas do PGR / NR-01  (NOVO)
app.include_router(pgr_router)

@app.get("/health")
def health():
    return {"status": "OK"}

