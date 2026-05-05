"""
AutoSEO AI Platform — Pydantic Schemas Central Hub
===================================================
Aggregates and re-exports schemas from specific modules.
"""

from app.models.user import User, UserCreate, UserUpdate, Token, TokenData, PyObjectId
from app.models.project import Project, ProjectCreate, ProjectUpdate
from app.models.crawler import AuditReport, AuditIssue, CrawlJobStatus, AuditRoadmap
from app.models.strategy import StrategyReport, KeywordCluster
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

# ── Domain Schemas (Still here for now or can be moved later) ──
class DomainPage(BaseModel):
    url: str
    traffic: int


class DomainTrend(BaseModel):
    date: str
    traffic: int


class DomainData(BaseModel):
    domain: str
    authority_score: int
    organic_traffic: int
    organic_keywords: int
    backlinks_count: int
    paid_keywords: int
    top_pages: List[DomainPage] = []
    traffic_trend: List[DomainTrend] = []
    last_updated: Optional[datetime] = None
