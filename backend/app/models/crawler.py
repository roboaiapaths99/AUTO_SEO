"""
AutoSEO AI Platform — Crawler Models
=====================================
Database models and Pydantic schemas for Site Audit Crawls.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class AuditIssue(BaseModel):
    type: str  # error, warning, notice
    category: str = ""
    message: str = ""
    url: str = ""
    # Legacy fields (kept for backward compat)
    severity: Optional[str] = None
    page_url: Optional[str] = None
    description: Optional[str] = None
    how_to_fix: Optional[str] = None


class AuditReport(BaseModel):
    job_id: Optional[str] = None
    project_id: Optional[str] = None
    domain: str = ""
    health_score: int = 0
    total_pages_crawled: int = 0
    total_issues: int = 0
    errors_count: int = 0
    warnings_count: int = 0
    notices_count: int = 0
    broken_links: List[Dict[str, Any]] = []
    issues_by_category: Dict[str, Any] = {}
    top_issues: List[Dict[str, Any]] = []
    page_stats: Dict[str, Any] = {}
    crawled_at: Optional[datetime] = None

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }


class CrawlJobStatus(BaseModel):
    job_id: str
    status: str  # running, completed, failed
    progress: int = 0  # 0-100
    pages_found: int = 0
    pages_crawled: int = 0
    max_pages: int = 50
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }
class RoadmapPhase(BaseModel):
    title: str
    objective: str
    steps: List[str]
    impact: str


class AuditRoadmap(BaseModel):
    domain: str
    summary: str
    phases: List[RoadmapPhase]
