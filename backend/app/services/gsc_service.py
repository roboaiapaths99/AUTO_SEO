"""
AutoSEO AI Platform — Google Search Console Service
===================================================
Fetches and processes real search performance data using GSC API.
"""

import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.services.integration_service import IntegrationService
from app.core.api_clients import GSCClient
from app.models.integration import IntegrationType

logger = logging.getLogger(__name__)

class GSCService:
    @staticmethod
    async def get_performance_overview(project_id: str, days: int = 30) -> Dict[str, Any]:
        """
        Get aggregated search performance for a project's domain.
        """
        # 1. Find GSC integration
        integration = await IntegrationService.get_integration_by_type(
            project_id, IntegrationType.GOOGLE_SEARCH_CONSOLE
        )
        
        if not integration or not integration.is_active:
            return {
                "success": False, 
                "error": "Google Search Console not connected or inactive for this project.",
                "connected": False
            }
            
        credentials_json = integration.config.get("credentials")
        site_url = integration.config.get("site_url")
        
        if not credentials_json or not site_url:
            return {
                "success": False, 
                "error": "GSC integration config is missing credentials or site URL.",
                "connected": True
            }
            
        # 2. Fetch data from GSC
        result = await GSCClient.get_performance_data(credentials_json, site_url, days)
        
        if not result["success"]:
            return result
            
        rows = result.get("data", [])
        
        # 3. Aggregate metrics
        total_clicks = sum(row.get("clicks", 0) for row in rows)
        total_impressions = sum(row.get("impressions", 0) for row in rows)
        avg_position = sum(row.get("position", 0) for row in rows) / len(rows) if rows else 0
        avg_ctr = (total_clicks / total_impressions) if total_impressions > 0 else 0
        
        # 4. Extract top keywords and pages
        keywords = {}
        pages = {}
        
        for row in rows:
            keys = row.get("keys", [])
            if len(keys) >= 2:
                query = keys[0]
                page = keys[1]
                
                # Aggregate by keyword
                if query not in keywords:
                    keywords[query] = {"clicks": 0, "impressions": 0, "position": 0, "count": 0}
                keywords[query]["clicks"] += row.get("clicks", 0)
                keywords[query]["impressions"] += row.get("impressions", 0)
                keywords[query]["position"] += row.get("position", 0)
                keywords[query]["count"] += 1
                
                # Aggregate by page
                if page not in pages:
                    pages[page] = {"clicks": 0, "impressions": 0}
                pages[page]["clicks"] += row.get("clicks", 0)
                pages[page]["impressions"] += row.get("impressions", 0)
                
        # Format top keywords
        top_keywords = []
        for kw, stats in keywords.items():
            top_keywords.append({
                "keyword": kw,
                "clicks": stats["clicks"],
                "impressions": stats["impressions"],
                "position": round(stats["position"] / stats["count"], 1),
                "ctr": stats["clicks"] / stats["impressions"] if stats["impressions"] > 0 else 0
            })
        top_keywords = sorted(top_keywords, key=lambda x: x["clicks"], reverse=True)[:50]
        
        return {
            "success": True,
            "connected": True,
            "total_clicks": total_clicks,
            "total_impressions": total_impressions,
            "avg_position": round(avg_position, 1),
            "avg_ctr": round(avg_ctr * 100, 2),
            "top_keywords": top_keywords,
            "start_date": result.get("start_date"),
            "end_date": result.get("end_date")
        }

    @staticmethod
    async def get_verified_sites(project_id: str) -> Dict[str, Any]:
        """Get list of verified sites for the connected Google account."""
        integration = await IntegrationService.get_integration_by_type(
            project_id, IntegrationType.GOOGLE_SEARCH_CONSOLE
        )
        
        if not integration:
            return {"success": False, "error": "GSC not connected"}
            
        credentials_json = integration.config.get("credentials")
        return await GSCClient.list_sites(credentials_json)
