"""
AutoSEO AI Platform — Project Endpoints
=========================================
REST API for managing user SEO projects.
"""

from typing import List
from fastapi import APIRouter, Depends, status
from app.api.deps import get_project_service, get_current_user
from app.models.schemas import Project, ProjectCreate, ProjectUpdate, User
from app.services.project_service import ProjectService

router = APIRouter()


@router.get("/", response_model=List[Project])
async def list_projects(
    current_user: User = Depends(get_current_user),
    project_service: ProjectService = Depends(get_project_service)
):
    """List all projects for the current user."""
    return await project_service.get_projects(current_user.id)


@router.post("/", response_model=Project, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_in: ProjectCreate,
    current_user: User = Depends(get_current_user),
    project_service: ProjectService = Depends(get_project_service)
):
    """Create a new SEO project."""
    return await project_service.create_project(current_user.id, project_in)


@router.get("/{project_id}", response_model=Project)
async def get_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    project_service: ProjectService = Depends(get_project_service)
):
    """Get a specific project by ID."""
    return await project_service.get_project(current_user.id, project_id)


@router.put("/{project_id}", response_model=Project)
async def update_project(
    project_id: str,
    project_in: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    project_service: ProjectService = Depends(get_project_service)
):
    """Update a project's details."""
    return await project_service.update_project(current_user.id, project_id, project_in)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    project_service: ProjectService = Depends(get_project_service)
):
    """Delete a project."""
    await project_service.delete_project(current_user.id, project_id)
    return None
