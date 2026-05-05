"""
AutoSEO AI Platform — Rank Tracking Endpoints
==============================================
REST API for tracking keyword positions.
"""

from fastapi import APIRouter, Depends, Body, Query
from typing import List, Optional
from app.api.deps import get_db, get_current_user
from app.services.rank_tracker import RankTrackerService

router = APIRouter()

@router.post("/track")
async def track_keywords(
    project_id: str = Body(...),
    domain: str = Body(...),
    keywords: List[str] = Body(...),
    db = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Trigger ranking check for keywords."""
    service = RankTrackerService(db)
    results = await service.track_keywords(project_id, domain, keywords)
    return {"success": True, "data": results}

@router.get("/latest/{project_id}")
async def get_latest_rankings(
    project_id: str,
    db = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get latest rankings for all keywords in a project."""
    service = RankTrackerService(db)
    results = await service.get_latest_rankings(project_id)
    return {"success": True, "data": results}

@router.get("/history/{project_id}")
async def get_ranking_history(
    project_id: str,
    keyword: str = Query(...),
    db = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get historical rankings for a specific keyword."""
    service = RankTrackerService(db)
    results = await service.get_ranking_history(project_id, keyword)
    return {"success": True, "data": results}
