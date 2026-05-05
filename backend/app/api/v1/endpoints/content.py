"""
AutoSEO AI Platform — Content Endpoints
=========================================
REST API for SEO writing assistant and templates.
"""

from fastapi import APIRouter, Depends, Body
from app.api.deps import get_db, get_current_user
from app.models.schemas import User
from app.services.content_service import ContentService

router = APIRouter()


async def get_content_service(db=Depends(get_db)) -> ContentService:
    return ContentService(db)


@router.post("/analyze")
async def analyze_content(
    text: str = Body(..., embed=True),
    keyword: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    content_service: ContentService = Depends(get_content_service)
):
    """Analyze text for SEO optimization."""
    return await content_service.analyze_content(text, keyword)


@router.post("/brief")
async def generate_content_brief(
    keyword: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    content_service: ContentService = Depends(get_content_service)
):
    """Generate an SEO content brief based on SERP analysis."""
    return await content_service.generate_content_brief(keyword)


@router.post("/generate")
async def generate_seo_content(
    keyword: str = Body(..., embed=True),
    content_type: str = Body("blog_post", embed=True),
    current_user: User = Depends(get_current_user),
    content_service: ContentService = Depends(get_content_service)
):
    """Generate SEO-optimized content using Gemini AI."""
    return await content_service.generate_seo_content(keyword, content_type)
