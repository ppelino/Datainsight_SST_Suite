from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy import func
from sqlalchemy.orm import Session

from database import Base, engine, SessionLocal
from models import *  # importa User, ASORecord, NR17Record, LTCATRecord etc.

# ❌ NÃO rodar create_all no Supabase (tabelas já existem)
# Base.metadata.create_all(bind=engine)
print("Tabelas já estão no Supabase — create_all desativado.")


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
# HELPERS DE BANCO
# ============================================================
def get_db() -> Session:
    """Abre e fecha sessão manualmente (sem depender de Depends aqui)."""
    db = SessionLocal()
    try:
        return db
    finally:
        # o fechamento é feito na mão nas rotas que usarem get_db()
        ...
        # (não usamos context manager aqui para manter simples neste arquivo)


# ============================================================
# ROTAS BÁSICAS
# ============================================================

@app.get("/")
def home():
    return {"msg": "API funcionando!"}


@app.get("/health")
def health():
    return {"status": "OK"}


# ============================================================
# DASHBOARD GERAL — /api/dashboard/geral
# ============================================================
# Esta rota é consumida pelo dashboard.js (fetchDashboardGeral)
# e retorna:
# - total_asos
# - total_nr17
# - total_ltcat
# - risco_medio_nr17
# - distribuicao_modulos
# - perfil_risco_nr17
# - agentes_top5
# - ultimas_atividades
# ============================================================

@app.get("/api/dashboard/geral")
def dashboard_geral():
    """
    Retorna indicadores consolidados da suíte:
    ASO / NR-17 / LTCAT.
    """
    db = SessionLocal()
    try:
        # ---------- Totais principais ----------
        try:
            total_asos = db.query(func.count(ASORecord.id)).scalar() or 0
        except Exception:
            total_asos = 0

        try:
            total_nr17 = db.query(func.count(NR17Record.id)).scalar() or 0
        except Exception:
            total_nr17 = 0

        try:
            total_ltcat = db.query(func.count(LTCATRecord.id)).scalar() or 0
        except Exception:
            total_ltcat = 0

        # ---------- Risco médio NR-17 ----------
        risco_medio_nr17 = 0.0
        try:
            media = db.query(func.avg(NR17Record.score)).scalar()
            if media is not None:
                risco_medio_nr17 = float(media)
        except Exception:
            risco_medio_nr17 = 0.0

        # ---------- Perfil de risco NR-17 (baixo / médio / alto) ----------
        perfil = {"baixo": 0, "medio": 0, "alto": 0}
        try:
            rows = (
                db.query(NR17Record.risk_level, func.count(NR17Record.id))
                .group_by(NR17Record.risk_level)
                .all()
            )
            for nivel, qtde in rows:
                if not nivel:
                    continue
                n = str(nivel).strip().lower()
                if "baixo" in n:
                    perfil["baixo"] += qtde
                elif "médio" in n or "medio" in n:
                    perfil["medio"] += qtde
                elif "alto" in n:
                    perfil["alto"] += qtde
        except Exception:
            # se der erro de campo/coluna, mantemos tudo zero
            pass

        # ---------- TOP 5 agentes nocivos (LTCAT) ----------
        agentes_top5 = []
        try:
            rows = (
                db.query(
                    LTCATRecord.agent_name,
                    func.count(LTCATRecord.id).label("total"),
                )
                .group_by(LTCATRecord.agent_name)
                .order_by(func.count(LTCATRecord.id).desc())
                .limit(5)
                .all()
            )
            for nome, total in rows:
                agentes_top5.append(
                    {"nome": nome or "Agente não informado", "ocorrencias": int(total)}
                )
        except Exception:
            agentes_top5 = []

        # ---------- Últimas atividades ----------
        # Por enquanto, deixamos vazio. Depois podemos montar
        # juntando NR-17 + LTCAT + ASO ordenados por data.
        ultimas_atividades = []

        # ---------- Monta resposta ----------
        return {
            "total_asos": total_asos,
            "total_nr17": total_nr17,
            "total_ltcat": total_ltcat,
            "risco_medio_nr17": risco_medio_nr17,
            "distribuicao_modulos": {
                "aso": total_asos,
                "nr17": total_nr17,
                "ltcat": total_ltcat,
            },
            "perfil_risco_nr17": perfil,
            "agentes_top5": agentes_top5,
            "ultimas_atividades": ultimas_atividades,
        }
    finally:
        db.close()


# ============================================================
# ROTAS PRINCIPAIS DOS MÓDULOS
# ============================================================

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
