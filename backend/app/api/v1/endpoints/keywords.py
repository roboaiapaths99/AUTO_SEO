"""
AutoSEO AI Platform — Keyword Endpoints
=========================================
REST API for keyword research, magic tool, and strategy.
"""

from fastapi import APIRouter, Depends, Body
from typing import List
from app.api.deps import get_db, get_current_user
from app.models.schemas import StrategyReport, User
from app.services.keyword_service import KeywordService

router = APIRouter()


async def get_keyword_service(db=Depends(get_db)) -> KeywordService:
    return KeywordService(db)


@router.post("/research", response_model=dict)
async def research_keyword(
    keyword: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    keyword_service: KeywordService = Depends(get_keyword_service)
):
    """Analyze a single keyword."""
    return await keyword_service.get_keyword_data(keyword)


@router.post("/magic", response_model=List[dict])
async def keyword_magic_tool(
    seed: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    keyword_service: KeywordService = Depends(get_keyword_service)
):
    """Generate hundreds of keyword suggestions from a seed."""
    return await keyword_service.get_keyword_suggestions(seed)


@router.post("/strategy", response_model=StrategyReport)
async def generate_strategy(
    keywords: List[str] = Body(..., embed=True),
    project_id: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    keyword_service: KeywordService = Depends(get_keyword_service)
):
    """Cluster keywords into a content strategy."""
    return await keyword_service.generate_strategy(project_id, keywords)
