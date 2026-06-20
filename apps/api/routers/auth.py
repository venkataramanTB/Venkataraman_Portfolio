from fastapi import APIRouter, HTTPException, status
from schemas import LoginRequest, Token
from auth import create_access_token, verify_password, hash_password
from config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

_hashed_admin_pw = hash_password(settings.ADMIN_PASSWORD)


@router.post("/login", response_model=Token)
def login(body: LoginRequest):
    if body.email != settings.ADMIN_EMAIL or not verify_password(body.password, _hashed_admin_pw):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token({"sub": body.email})
    return Token(access_token=token)
