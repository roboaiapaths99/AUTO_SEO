"""
AutoSEO AI Platform — Integration Models
=========================================
Database models and Pydantic schemas for CMS and third-party integrations.
"""

from datetime import datetime
from typing import Dict, Optional, Any
from pydantic import BaseModel, Field
from bson import ObjectId
from app.models.user import PyObjectId


class IntegrationType:
    WORDPRESS = "wordpress"
    SHOPIFY = "shopify"
    CUSTOM = "custom"
    GOOGLE_SEARCH_CONSOLE = "gsc"
    DATAFORSEO = "dataforseo"


class IntegrationBase(BaseModel):
    project_id: PyObjectId
    type: str = Field(..., description="Type of integration (wordpress, shopify, etc.)")
    is_active: bool = True
    config: Dict[str, Any] = Field(default_factory=dict, description="Configuration parameters")


class IntegrationCreate(IntegrationBase):
    pass


class IntegrationUpdate(BaseModel):
    is_active: Optional[bool] = None
    config: Optional[Dict[str, Any]] = None


class Integration(IntegrationBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime
    updated_at: datetime

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }
