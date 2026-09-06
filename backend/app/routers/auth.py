import hashlib
import hmac
import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import UserAccount
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["Authentication"])

class Credentials(BaseModel):
    username: str
    password: str

def hash_password(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 120_000)
    return f"{salt.hex()}:{digest.hex()}"

def verify_password(password: str, stored: str) -> bool:
    try:
        salt_hex, digest_hex = stored.split(":", 1)
        expected = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt_hex), 120_000)
        return hmac.compare_digest(expected.hex(), digest_hex)
    except (ValueError, TypeError):
        return False

@router.post("/register")
def register(credentials: Credentials, db: Session = Depends(get_db)):
    username = credentials.username.strip().lower()
    if len(username) < 3 or len(credentials.password) < 6:
        raise HTTPException(status_code=400, detail="Username must have 3+ characters and password 6+ characters")
    if db.query(UserAccount).filter(UserAccount.username == username).first():
        raise HTTPException(status_code=409, detail="Username already exists")
    user = UserAccount(username=username, password_hash=hash_password(credentials.password))
    db.add(user)
    db.commit()
    return {"username": username}

@router.post("/login")
def login(credentials: Credentials, db: Session = Depends(get_db)):
    username = credentials.username.strip().lower()
    user = db.query(UserAccount).filter(UserAccount.username == username).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return {"username": user.username}