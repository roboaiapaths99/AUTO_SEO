"""
AutoSEO AI Platform — Competitor Endpoints
============================================
REST API for competitor analysis.
"""

from fastapi import APIRouter, Depends, Body, Query
from typing import List
from app.api.deps import get_db, get_current_user
from app.models.schemas import User
from app.services.competitor_service import CompetitorService

router = APIRouter()


async def get_competitor_service(db=Depends(get_db)) -> CompetitorService:
    return CompetitorService(db)


@router.get("/compare", response_model=dict)
async def compare_domains_get(
    domain_a: str = Query(...),
    domain_b: str = Query(...),
    current_user: User = Depends(get_current_user),
    competitor_service: CompetitorService = Depends(get_competitor_service)
):
    """Compare two domains side-by-side (GET)."""
    return await competitor_service.compare_two_domains(domain_a, domain_b)


@router.post("/compare", response_model=List[dict])
async def compare_competitors(
    domains: List[str] = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    competitor_service: CompetitorService = Depends(get_competitor_service)
):
    """Compare multiple domains side-by-side (POST)."""
    return await competitor_service.compare_domains(domains)


@router.get("/discover")
async def discover_competitors(
    domain: str = Query(...),
    current_user: User = Depends(get_current_user),
    competitor_service: CompetitorService = Depends(get_competitor_service)
):
    """Automatically discover top SEO competitors for a domain."""
    return await competitor_service.discover_competitors(domain)


@router.get("/ppc-bridge")
async def get_ppc_bridge(
    project_id: str = Query(None),
    domain: str = Query(...),
    competitors: List[str] = Query(None),
    db=Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Identify opportunities to steal competitor paid traffic organically."""
    from app.services.ppc_bridge_service import PPCBridgeService
    service = PPCBridgeService(db)
    return await service.get_ppc_opportunities(project_id, domain, competitors)
