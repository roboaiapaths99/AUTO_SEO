"""
AutoSEO AI Platform — Backlink Endpoints
========================================
REST API for backlink analysis.
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from app.api.deps import get_db, get_current_user
from app.models.schemas import User
from app.services.backlink_service import BacklinkService

router = APIRouter()


async def get_backlink_service(db=Depends(get_db)) -> BacklinkService:
    return BacklinkService(db)


@router.get("/profile")
async def get_backlink_profile(
    domain: str = Query(..., description="The domain to analyze"),
    current_user: User = Depends(get_current_user),
    backlink_service: BacklinkService = Depends(get_backlink_service)
):
    """Get backlink profile for any domain."""
    return await backlink_service.get_backlink_profile(domain)


@router.get("/new-lost")
async def get_new_lost_backlinks(
    domain: str = Query(..., description="The domain to analyze"),
    current_user: User = Depends(get_current_user),
    backlink_service: BacklinkService = Depends(get_backlink_service)
):
    """Get new and lost backlinks."""
    return await backlink_service.get_new_lost_backlinks(domain)


@router.get("/gap")
async def get_backlink_gap(
    primary: str = Query(..., description="Your domain"),
    competitor: str = Query(..., description="Competitor domain"),
    current_user: User = Depends(get_current_user),
    backlink_service: BacklinkService = Depends(get_backlink_service)
):
    """Find backlink gaps between two domains."""
    return await backlink_service.get_backlink_gap(primary, competitor)
