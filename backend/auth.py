from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta

SECRET_KEY = "CHAVE_SUPER_SECRETA"  # depois troca
ALGORITHM = "HS256"

pwd = CryptContext(schemes=["bcrypt"])

def hash_password(password: str):
    return pwd.hash(password)

def verify_password(password: str, hashed: str):
    return pwd.verify(password, hashed)

def create_token(data: dict):
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(hours=24)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
