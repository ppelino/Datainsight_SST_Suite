from fastapi import FastAPI
from .database import Base, engine
from .routers import auth_router

app = FastAPI(title="Datainsight SST Suite")

Base.metadata.create_all(bind=engine)

@app.get("/")
def home():
    return {"msg": "API funcionando!"}

app.include_router(auth_router.router)

@app.get("/health")
def health():
    return {"status": "OK"}
