"""
AutoSEO AI Platform — Auth Endpoints
======================================
REST API for user registration and authentication.
"""

from fastapi import APIRouter, Depends, Body, status
from fastapi.security import OAuth2PasswordRequestForm
from app.api.deps import get_auth_service, get_current_user
from app.models.user import User, UserCreate, Token, UserUpdate, UserPreferences
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
async def register(
    user_in: UserCreate,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Register a new user."""
    return await auth_service.register_user(user_in)


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Log in and get access/refresh tokens."""
    user = await auth_service.authenticate_user(form_data.username, form_data.password)
    return auth_service.create_tokens(user.id)


@router.get("/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get the current authenticated user profile."""
    return current_user


@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token: str = Body(..., embed=True),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Refresh the access token using a refresh token."""
    return await auth_service.refresh_access_token(refresh_token)


@router.put("/me", response_model=User)
async def update_me(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Update current user profile."""
    return await auth_service.update_user(current_user.id, user_update)


@router.put("/password")
async def change_password(
    data: dict = Body(...),
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Change current user password."""
    await auth_service.change_password(
        current_user.id, 
        data.get("current_password"), 
        data.get("new_password")
    )
    return {"message": "Password updated successfully"}


@router.put("/preferences", response_model=User)
async def update_preferences(
    preferences: UserPreferences,
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Update current user preferences."""
    return await auth_service.update_preferences(current_user.id, preferences)


@router.post("/api-keys")
async def create_api_key(
    data: dict = Body(...),
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Generate a new API key."""
    key = await auth_service.generate_api_key(current_user.id, data.get("name", "Default Key"))
    return {"key": key}


@router.delete("/api-keys/{key}")
async def delete_api_key(
    key: str,
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Delete an API key."""
    await auth_service.delete_api_key(current_user.id, key)
    return {"message": "API key deleted successfully"}
