"""
AutoSEO AI Platform — Strategy Models
======================================
Database models and Pydantic schemas for Keyword Strategy & Clusters.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from bson import ObjectId
from app.models.user import PyObjectId


class KeywordCluster(BaseModel):
    topic: str
    keywords: List[str]
    total_volume: int
    average_difficulty: int
    intent: str


class StrategyReport(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    project_id: PyObjectId
    seed_keyword: str
    clusters: List[KeywordCluster]
    created_at: datetime

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }
