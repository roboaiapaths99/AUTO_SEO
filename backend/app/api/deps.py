"""
AutoSEO AI Platform — API Dependencies
========================================
Shared dependencies for FastAPI endpoints.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from motor.motor_asyncio import AsyncIOMotorDatabase
from jose import jwt, JWTError

from app.core.config import settings
from app.core.database import get_database
from app.core.security import decode_token
from app.models.schemas import User, TokenData
from app.services.auth_service import AuthService
from app.services.project_service import ProjectService
from app.services.ai_service import AIVisibilityService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")


async def get_db() -> AsyncIOMotorDatabase:
    """Dependency to get the MongoDB database."""
    return get_database()


async def get_auth_service(db: AsyncIOMotorDatabase = Depends(get_db)) -> AuthService:
    """Dependency to get the AuthService."""
    return AuthService(db)


async def get_project_service(db: AsyncIOMotorDatabase = Depends(get_db)) -> ProjectService:
    """Dependency to get the ProjectService."""
    return ProjectService(db)


async def get_ai_service(db: AsyncIOMotorDatabase = Depends(get_db)) -> AIVisibilityService:
    """Dependency to get the AIVisibilityService."""
    return AIVisibilityService(db)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    auth_service: AuthService = Depends(get_auth_service)
) -> User:
    """
    Dependency to get the current authenticated user from JWT.
    
    Raises:
        HTTPException: If token is invalid, expired, or user not found.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception
        
    user_id: str = payload.get("sub")
    token_type: str = payload.get("type")
    
    if user_id is None or token_type != "access":
        raise credentials_exception
        
    return await auth_service.get_user_by_id(user_id)
