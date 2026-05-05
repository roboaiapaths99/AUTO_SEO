"""
AutoSEO AI Platform — AI Visibility Endpoints
===============================================
REST API for monitoring brand presence in AI models.
"""

from fastapi import APIRouter, Depends, Query
from app.api.deps import get_db, get_current_user
from app.services.ai_service import AIVisibilityService

router = APIRouter()

@router.get("/{project_id}")
async def get_visibility_report(
    project_id: str,
    brand_name: str = Query(...),
    domain: str = Query(...),
    force: bool = Query(False),
    db = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Fetch or generate a real AI visibility report."""
    service = AIVisibilityService(db)
    report = await service.get_visibility_report(project_id, brand_name, domain, force_refresh=force)
    return {"success": True, "data": report}

@router.post("/{project_id}/apply-fixes")
async def apply_fixes(
    project_id: str,
    integration_type: str = Query(..., alias="type"),
    db = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Apply AI-driven fixes via connected integration."""
    service = AIVisibilityService(db)
    try:
        result = await service.apply_fixes(project_id, integration_type)
        return result
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=str(e))
