"""
AutoSEO AI Platform — API V1 Router
=====================================
Aggregates all API v1 endpoints into a single router.
"""

from fastapi import APIRouter
from app.api.v1.endpoints import auth, projects, domains, keywords, audit, competitors, ai_visibility, content, backlinks, tracking, integrations, aio

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(domains.router, prefix="/domains", tags=["domains"])
api_router.include_router(keywords.router, prefix="/keywords", tags=["keywords"])
api_router.include_router(audit.router, prefix="/audit", tags=["audit"])
api_router.include_router(competitors.router, prefix="/competitors", tags=["competitors"])
api_router.include_router(ai_visibility.router, prefix="/ai-visibility", tags=["ai-visibility"])
api_router.include_router(content.router, prefix="/content", tags=["content"])
api_router.include_router(backlinks.router, prefix="/backlinks", tags=["backlinks"])
api_router.include_router(tracking.router, prefix="/tracking", tags=["tracking"])
api_router.include_router(integrations.router, prefix="/integrations", tags=["integrations"])
api_router.include_router(aio.router, prefix="/aio", tags=["aio"])
