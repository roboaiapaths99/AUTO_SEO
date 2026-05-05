"""
AutoSEO AI Platform — AIO (AI Optimization) Models
==================================================
Models for monitoring AI brand mentions and hallucinations.
"""

from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class VerifiedBrandData(BaseModel):
    """Real truth about the brand, used to check for AI hallucinations."""
    project_id: str
    official_name: str
    founded_year: Optional[int] = None
    headquarters: Optional[str] = None
    key_products: List[str] = []
    founder_ceo: Optional[str] = None
    mission_statement: Optional[str] = None
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AIMention(BaseModel):
    """A specific instance of an AI model mentioning the brand."""
    project_id: str
    model_name: str # ChatGPT, Gemini, Claude
    query: str
    response_text: str
    sentiment: str # Positive, Neutral, Negative
    is_accurate: bool = True
    hallucination_details: Optional[str] = None
    detected_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AIOCorrection(BaseModel):
    """Schema generated to correct AI misinformation."""
    project_id: str
    type: str # organization, product, person
    schema_json: Dict[str, Any]
    pushed_to_cms: bool = False
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
