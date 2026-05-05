"""
AutoSEO AI Platform — Domain Endpoints
========================================
REST API for domain research and comparison.
"""

from fastapi import APIRouter, Depends, Query
from app.api.deps import get_db
from app.models.schemas import DomainData
from app.services.domain_service import DomainService

router = APIRouter()


async def get_domain_service(db=Depends(get_db)) -> DomainService:
    return DomainService(db)


@router.get("/overview", response_model=DomainData)
async def get_domain_overview(
    domain: str = Query(..., description="The domain to analyze"),
    domain_service: DomainService = Depends(get_domain_service)
):
    """Get SEO overview for any domain."""
    return await domain_service.get_domain_overview(domain)
