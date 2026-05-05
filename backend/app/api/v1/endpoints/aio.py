"""
AutoSEO AI Platform — AIO Endpoints
===================================
API routes for AI Optimization features.
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from app.api.deps import get_db
from app.services.aio_service import AIOService
from app.services.cms_service import CMSService
from app.models.aio import VerifiedBrandData, AIMention, AIOCorrection

router = APIRouter()

@router.get("/{project_id}/mentions", response_model=List[AIMention])
async def get_ai_mentions(project_id: str, db=Depends(get_db)):
    service = AIOService(db)
    return await service.get_mentions(project_id)

@router.post("/{project_id}/probe")
async def probe_ai(project_id: str, payload: Dict[str, str], db=Depends(get_db)):
    service = AIOService(db)
    query = payload.get("query")
    return await service.probe_ai_for_hallucinations(project_id, query)

@router.get("/{project_id}/verified", response_model=VerifiedBrandData)
async def get_verified_data(project_id: str, db=Depends(get_db)):
    service = AIOService(db)
    data = await service.get_verified_data(project_id)
    if not data:
        raise HTTPException(status_code=404, detail="Verified data not found")
    return data

@router.post("/{project_id}/verified")
async def update_verified_data(project_id: str, data: Dict[str, Any], db=Depends(get_db)):
    service = AIOService(db)
    await service.upsert_verified_data(project_id, data)
    return {"status": "success"}

@router.get("/{project_id}/corrections", response_model=List[AIOCorrection])
async def get_corrections(project_id: str, db=Depends(get_db)):
    cursor = db.aio_corrections.find({"project_id": project_id}).sort("generated_at", -1)
    corrections = await cursor.to_list(length=10)
    return [AIOCorrection(**c) for c in corrections]

@router.post("/{project_id}/apply-fixes")
async def apply_fixes(project_id: str, type: str = Query(...), db=Depends(get_db)):
    service = AIOService(db)
    cms_service = CMSService(db)
    
    # 1. Fetch the correction schema
    correction = await db.aio_corrections.find_one({"project_id": project_id, "type": type})
    if not correction:
        raise HTTPException(status_code=404, detail="Correction schema not found")
        
    # 2. Deploy to CMS (Simulated)
    deployment_result = await cms_service.deploy_schema(project_id, type, correction["schema_json"])
    
    # 3. Mark as pushed in DB
    await db.aio_corrections.update_many(
        {"project_id": project_id, "type": type},
        {"$set": {"pushed_to_cms": True, "deployed_at": deployment_result.get("deployed_at")}}
    )
    
    return {
        "status": "success", 
        "message": deployment_result.get("message"),
        "deployment": deployment_result
    }
