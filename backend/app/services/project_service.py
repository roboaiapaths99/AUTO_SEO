"""
AutoSEO AI Platform — Project Service
=======================================
Business logic for managing SEO projects.
"""

from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.schemas import ProjectCreate, ProjectUpdate, Project
from bson import ObjectId


class ProjectService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.projects

    async def create_project(self, user_id: str, project_in: ProjectCreate) -> Project:
        """Create a new SEO project for a user."""
        project_dict = project_in.dict()
        project_dict["user_id"] = ObjectId(user_id)
        project_dict["created_at"] = datetime.now(timezone.utc)
        project_dict["updated_at"] = project_dict["created_at"]

        result = await self.collection.insert_one(project_dict)
        project_dict["_id"] = result.inserted_id
        
        return Project(**project_dict)

    async def get_projects(self, user_id: str) -> List[Project]:
        """List all projects for a user."""
        cursor = self.collection.find({"user_id": ObjectId(user_id)})
        projects = await cursor.to_list(length=100)
        return [Project(**p) for p in projects]

    async def get_project(self, user_id: str, project_id: str) -> Project:
        """Get a single project by ID, ensuring ownership."""
        project_dict = await self.collection.find_one({
            "_id": ObjectId(project_id),
            "user_id": ObjectId(user_id)
        })
        
        if not project_dict:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found.",
            )
            
        return Project(**project_dict)

    async def update_project(self, user_id: str, project_id: str, project_in: ProjectUpdate) -> Project:
        """Update a project's details."""
        update_data = {k: v for k, v in project_in.dict().items() if v is not None}
        update_data["updated_at"] = datetime.now(timezone.utc)
        
        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(project_id), "user_id": ObjectId(user_id)},
            {"$set": update_data},
            return_document=True
        )
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found.",
            )
            
        return Project(**result)

    async def delete_project(self, user_id: str, project_id: str) -> bool:
        """Delete a project."""
        result = await self.collection.delete_one({
            "_id": ObjectId(project_id),
            "user_id": ObjectId(user_id)
        })
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found.",
            )
            
        return True
