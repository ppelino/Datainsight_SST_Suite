from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta

SECRET_KEY = "CHAVE_SUPER_SECRETA"  # depois você troca por uma env var
ALGORITHM = "HS256"

# Troquei bcrypt -> pbkdf2_sha256
pwd = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return pwd.verify(password, hashed)


def create_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(hours=24)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


