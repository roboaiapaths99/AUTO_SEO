"""
AutoSEO AI Platform — Rank Tracker Service (REAL)
==================================================
Tracks keyword positions using DataForSEO SERP API.
"""

from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.api_clients import DataForSEOClient
import logging

logger = logging.getLogger(__name__)


class RankTrackerService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.rankings

    async def track_keywords(self, project_id: str, domain: str, keywords: List[str]) -> List[dict]:
        """Check rankings for a list of keywords."""
        results = []
        domain = domain.lower().strip().replace("https://", "").replace("http://", "").rstrip("/")

        for keyword in keywords:
            try:
                # Real SERP check via DataForSEO
                serp_data = await DataForSEOClient.get_serp_data(keyword)
                
                position = None
                url = None
                
                if serp_data["success"] and serp_data.get("data"):
                    # Client flattens to the items list for serp_data
                    items = serp_data["data"]
                    if not isinstance(items, list):
                        items = []
                        
                    # Find our domain in the results
                    for item in items:
                        item_domain = item.get("domain", "")
                        if domain in item_domain:
                            position = item.get("rank_group")
                            url = item.get("url")
                            break
                
                ranking_entry = {
                    "project_id": project_id,
                    "keyword": keyword,
                    "position": position,
                    "url": url,
                    "recorded_at": datetime.now(timezone.utc),
                    "source": serp_data.get("source", "dummy")
                }
                
                # Save to DB
                await self.collection.insert_one(ranking_entry)
                
                # Cleanup for response
                ranking_entry.pop("_id", None)
                results.append(ranking_entry)
                
            except Exception as e:
                logger.error(f"Failed to track ranking for {keyword}: {e}")
                
        return results

    async def get_ranking_history(self, project_id: str, keyword: str) -> List[dict]:
        """Get position history for a specific keyword."""
        cursor = self.collection.find(
            {"project_id": project_id, "keyword": keyword},
            sort=[("recorded_at", 1)]
        )
        history = await cursor.to_list(length=100)
        for h in history:
            h.pop("_id", None)
        return history

    async def get_latest_rankings(self, project_id: str) -> List[dict]:
        """Get the most recent position for all tracked keywords."""
        # This would ideally use an aggregation to get the latest entry per keyword
        pipeline = [
            {"$match": {"project_id": project_id}},
            {"$sort": {"recorded_at": -1}},
            {"$group": {
                "_id": "$keyword",
                "position": {"$first": "$position"},
                "url": {"$first": "$url"},
                "recorded_at": {"$first": "$recorded_at"}
            }},
            {"$project": {
                "keyword": "$_id",
                "_id": 0,
                "position": 1,
                "url": 1,
                "recorded_at": 1
            }}
        ]
        results = await self.collection.aggregate(pipeline).to_list(length=1000)
        return results
