"""
AutoSEO AI Platform — Integrations API Endpoints
=================================================
Manage project integrations for CMS platforms and SEO tools.
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.integration import Integration, IntegrationCreate, IntegrationUpdate, IntegrationType
from app.services.integration_service import IntegrationService
from app.models.user import User
from app.api.v1.endpoints.auth import get_current_user
from app.core.config import settings
from google_auth_oauthlib.flow import Flow
import logging
import json
import os

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/{project_id}", response_model=List[Integration])
async def get_project_integrations(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """Retrieve all integrations for a specific project."""
    return await IntegrationService.get_project_integrations(project_id)


@router.post("/{project_id}/connect", response_model=Integration)
async def connect_integration(
    project_id: str,
    integration_in: IntegrationCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Connect or update an integration for a project.
    Verifies credentials before saving.
    """
    try:
        # 1. Verify credentials first
        verification = await IntegrationService.verify_integration(
            integration_in.type, 
            integration_in.config
        )
        
        if not verification.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=verification.get("message", "Verification failed")
            )

        # 2. Force the project_id from URL if it differs from body
        integration_in.project_id = project_id
        return await IntegrationService.create_integration(integration_in)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error connecting integration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to connect integration: {str(e)}"
        )


@router.post("/{project_id}/verify/{integration_type}")
async def verify_integration_credentials(
    project_id: str,
    integration_type: str,
    config: dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Verify credentials without saving."""
    return await IntegrationService.verify_integration(integration_type, config)


@router.delete("/{project_id}/{integration_type}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_integration_by_type(
    project_id: str,
    integration_type: str,
    current_user: User = Depends(get_current_user)
):
    """Remove an integration by type."""
    integration = await IntegrationService.get_integration_by_type(project_id, integration_type)
    if not integration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Integration not found"
        )
    
    success = await IntegrationService.delete_integration(str(integration.id))
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete integration"
        )
    return None


@router.get("/{project_id}/gsc/auth-url")
async def get_gsc_auth_url(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Generate a Google OAuth2 authorization URL for Search Console access.
    The state parameter carries the project_id to identify it in the callback.
    """
    try:
        # Load client config from file or settings
        if not os.path.exists(settings.GOOGLE_SEARCH_CONSOLE_CREDENTIALS_PATH):
            # Try to construct from environment variables if file missing
            # (Assuming we have GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)
            client_config = {
                "web": {
                    "client_id": os.getenv("GOOGLE_CLIENT_ID"),
                    "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/v1/integrations/gsc/callback")]
                }
            }
        else:
            with open(settings.GOOGLE_SEARCH_CONSOLE_CREDENTIALS_PATH, 'r') as f:
                client_config = json.load(f)

        client_type = "web" if "web" in client_config else "installed"
        redirect_uri = client_config[client_type]["redirect_uris"][0]

        flow = Flow.from_client_config(
            client_config,
            scopes=['https://www.googleapis.com/auth/webmasters.readonly'],
            redirect_uri=redirect_uri
        )

        # Include project_id in state to retrieve it later
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            state=project_id,
            prompt='consent'
        )

        return {"auth_url": authorization_url}
    except Exception as e:
        logger.error(f"Error generating GSC auth URL: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not initialize Google OAuth: {str(e)}"
        )


@router.get("/gsc/callback")
async def gsc_callback(
    code: str,
    state: str, # This is our project_id
):
    """
    Handle the OAuth2 callback from Google.
    Exchanges the code for tokens and saves the integration.
    """
    try:
        project_id = state
        
        if not os.path.exists(settings.GOOGLE_SEARCH_CONSOLE_CREDENTIALS_PATH):
            client_config = {
                "web": {
                    "client_id": os.getenv("GOOGLE_CLIENT_ID"),
                    "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/v1/integrations/gsc/callback")]
                }
            }
        else:
            with open(settings.GOOGLE_SEARCH_CONSOLE_CREDENTIALS_PATH, 'r') as f:
                client_config = json.load(f)

        client_type = "web" if "web" in client_config else "installed"
        redirect_uri = client_config[client_type]["redirect_uris"][0]

        flow = Flow.from_client_config(
            client_config,
            scopes=['https://www.googleapis.com/auth/webmasters.readonly'],
            redirect_uri=redirect_uri
        )

        flow.fetch_token(code=code)
        credentials = flow.credentials

        from app.core.database import get_database
        from bson import ObjectId
        from datetime import datetime, timezone
        db = get_database()
        
        # Get project to get the domain
        project = await db.projects.find_one({"_id": ObjectId(project_id)})
        site_url = project.get("domain") if project else ""
        # Search Console usually prefers the exact property URL, e.g., sc-domain:example.com or https://example.com/
        if site_url and not site_url.startswith("http") and not site_url.startswith("sc-domain:"):
            # Use domain property format by default for broader coverage
            site_url = f"sc-domain:{site_url}"

        # Save tokens to database via IntegrationService
        integration_data = IntegrationCreate(
            project_id=project_id,
            type=IntegrationType.GOOGLE_SEARCH_CONSOLE,
            config={
                "credentials": {
                    "token": credentials.token,
                    "refresh_token": credentials.refresh_token,
                    "token_uri": credentials.token_uri,
                    "client_id": credentials.client_id,
                    "client_secret": credentials.client_secret,
                    "scopes": credentials.scopes
                },
                "site_url": site_url,
                "connected_at": datetime.now(timezone.utc).isoformat()
            },
            is_active=True
        )

        await IntegrationService.create_integration(integration_data)

        # Redirect back to frontend
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=f"{frontend_url}/settings?integration=gsc&status=success")
        
    except Exception as e:
        logger.error(f"Error in GSC OAuth callback: {e}")
        # In a real app, redirect with error message
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=f"{frontend_url}/settings?integration=gsc&status=error&message={str(e)}")
@router.get("/gsc/performance/{project_id}")
async def get_gsc_performance(
    project_id: str,
    days: int = 30,
    current_user: User = Depends(get_current_user)
):
    """
    Fetch real performance data from Google Search Console.
    """
    from app.services.gsc_service import GSCService
    
    result = await GSCService.get_performance_overview(project_id, days)
    if not result["success"]:
        if result.get("error") == "Google Search Console not connected or inactive for this project.":
            raise HTTPException(status_code=404, detail=result["error"])
        raise HTTPException(status_code=500, detail=result["error"])
    
    return result
