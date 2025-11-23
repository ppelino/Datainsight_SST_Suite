from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from routers import auth_router

app = FastAPI(title="Datainsight SST Suite")

# ⚙️ CORS - libera o front da Netlify e testes locais
origins = [
    "https://datainsightsstsuite.netlify.app",   # seu frontend em produção
    "https://datainsight-sst-suite.onrender.com",  # a própria API (se precisar)
    "http://localhost:5500",                     # testes locais (opcional)
    "http://127.0.0.1:5500",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🗄️ cria tabelas se ainda não existirem
Base.metadata.create_all(bind=engine)

@app.get("/")
def home():
    return {"msg": "API funcionando!"}

# rotas de autenticação
app.include_router(auth_router.router)

@app.get("/health")
def health():
    return {"status": "OK"}



