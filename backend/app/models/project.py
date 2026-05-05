"""
AutoSEO AI Platform — Project Models
=====================================
Database models and Pydantic schemas for SEO Projects.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from bson import ObjectId
from app.models.user import PyObjectId


class ProjectBase(BaseModel):
    name: str
    domain: str
    description: Optional[str] = None
    competitors: List[str] = []
    tracked_keywords: List[str] = []


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None
    description: Optional[str] = None
    competitors: Optional[List[str]] = None
    tracked_keywords: Optional[List[str]] = None


class Project(ProjectBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId
    created_at: datetime
    updated_at: datetime

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }
