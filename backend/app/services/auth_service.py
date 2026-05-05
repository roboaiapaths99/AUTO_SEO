"""
AutoSEO AI Platform — Authentication Service
=============================================
Business logic for user registration, login, and token refresh.
"""

from datetime import datetime, timezone
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.models.user import UserCreate, User, Token, UserUpdate, UserPreferences, APIKey
from bson import ObjectId
import secrets


class AuthService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.users

    async def register_user(self, user_in: UserCreate) -> User:
        """Register a new user."""
        # Check if user already exists
        if await self.collection.find_one({"email": user_in.email}):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists.",
            )

        # Create user document
        user_dict = user_in.dict()
        password = user_dict.pop("password")
        user_dict["hashed_password"] = hash_password(password)
        user_dict["is_active"] = True
        user_dict["plan"] = "free"
        user_dict["created_at"] = datetime.now(timezone.utc)
        user_dict["updated_at"] = user_dict["created_at"]

        result = await self.collection.insert_one(user_dict)
        user_dict["_id"] = result.inserted_id
        
        return User(**user_dict)

    async def authenticate_user(self, email: str, password: str) -> User:
        """Authenticate a user by email and password."""
        user_dict = await self.collection.find_one({"email": email})
        if not user_dict or not verify_password(password, user_dict["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password.",
            )
        
        if not user_dict.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user.",
            )
            
        return User(**user_dict)

    async def get_user_by_id(self, user_id: str) -> User:
        """Get user by ID."""
        user_dict = await self.collection.find_one({"_id": ObjectId(user_id)})
        if not user_dict:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )
        return User(**user_dict)

    def create_tokens(self, user_id: str) -> Token:
        """Create access and refresh tokens for a user ID."""
        return Token(
            access_token=create_access_token(data={"sub": str(user_id)}),
            refresh_token=create_refresh_token(data={"sub": str(user_id)}),
            token_type="bearer"
        )

    async def refresh_access_token(self, refresh_token: str) -> Token:
        """Refresh access token using a valid refresh token."""
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token.",
            )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload.",
            )
            
        # Optional: Check if user still exists/is active
        user_dict = await self.collection.find_one({"_id": ObjectId(user_id)})
        if not user_dict or not user_dict.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive.",
            )
            
        return self.create_tokens(user_id)

    async def update_user(self, user_id: str, user_update: UserUpdate) -> User:
        """Update user profile information."""
        update_data = user_update.dict(exclude_unset=True)
        if "password" in update_data:
            password = update_data.pop("password")
            update_data["hashed_password"] = hash_password(password)
        
        update_data["updated_at"] = datetime.now(timezone.utc)
        
        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(user_id)},
            {"$set": update_data},
            return_document=True
        )
        
        if not result:
            raise HTTPException(status_code=404, detail="User not found")
        
        return User(**result)

    async def change_password(self, user_id: str, current_password: str, new_password: str) -> bool:
        """Change user password."""
        user = await self.collection.find_one({"_id": ObjectId(user_id)})
        if not user or not verify_password(current_password, user["hashed_password"]):
            raise HTTPException(status_code=400, detail="Incorrect current password")
        
        await self.collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {
                "hashed_password": hash_password(new_password),
                "updated_at": datetime.now(timezone.utc)
            }}
        )
        return True

    async def update_preferences(self, user_id: str, preferences: UserPreferences) -> User:
        """Update user preferences."""
        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(user_id)},
            {"$set": {
                "preferences": preferences.dict(),
                "updated_at": datetime.now(timezone.utc)
            }},
            return_document=True
        )
        return User(**result)

    async def generate_api_key(self, user_id: str, name: str) -> str:
        """Generate a new API key for the user."""
        key = f"aseo_{secrets.token_urlsafe(32)}"
        new_key = APIKey(
            key=key,
            name=name,
            created_at=datetime.now(timezone.utc)
        )
        
        await self.collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$push": {"api_keys": new_key.dict()}}
        )
        return key

    async def delete_api_key(self, user_id: str, key: str) -> bool:
        """Delete an API key."""
        await self.collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$pull": {"api_keys": {"key": key}}}
        )
        return True
