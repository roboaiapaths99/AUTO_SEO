"""
AutoSEO AI Platform — Backlink Service
========================================
Backlink analysis using DataForSEO (with dummy fallback).
"""

from datetime import datetime, timezone
from typing import List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.api_clients import DataForSEOClient

import logging
logger = logging.getLogger(__name__)


class BacklinkService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.backlinks

    async def get_backlink_profile(self, domain: str) -> dict:
        """Get full backlink profile for a domain."""
        domain = domain.lower().strip().replace("https://", "").replace("http://", "").rstrip("/")

        # Check cache
        cached = await self.collection.find_one({"domain": domain})
        if cached:
            age = (datetime.now(timezone.utc) - cached.get("last_updated", datetime.min).replace(tzinfo=timezone.utc)).total_seconds()
            if age < 86400:  # 24h cache
                cached.pop("_id", None)
                return cached

        # Fetch from DataForSEO (real or dummy)
        result = await DataForSEOClient.get_backlinks(domain)

        profile = {
            "domain": domain,
            "total_backlinks": 0,
            "referring_domains": 0,
            "backlinks": [],
            "dofollow_count": 0,
            "nofollow_count": 0,
            "data_source": "dummy",
            "last_updated": datetime.now(timezone.utc),
        }

        if result["success"] and result.get("data"):
            data = result["data"]
            # Client flattens to the result object or items list
            # For backlinks, it's usually the result object itself containing total_count and items
            profile["total_backlinks"] = data.get("total_count", 0) or data.get("total_backlinks", 0)
            profile["referring_domains"] = data.get("referring_domains_count", 0) or data.get("referring_domains", 0)
            profile["backlinks"] = data.get("items", []) or data.get("backlinks", [])
            profile["data_source"] = result.get("source", "dataforseo")

            # Count dofollow/nofollow
            for bl in profile["backlinks"]:
                is_dofollow = bl.get("dofollow", True)
                if is_dofollow:
                    profile["dofollow_count"] += 1
                else:
                    profile["nofollow_count"] += 1

        # Anchor text distribution
        anchors = {}
        for bl in profile["backlinks"]:
            anchor = bl.get("anchor_text", "").strip() or "(empty)"
            anchors[anchor] = anchors.get(anchor, 0) + 1
        profile["anchor_distribution"] = [
            {"anchor": k, "count": v} for k, v in sorted(anchors.items(), key=lambda x: -x[1])[:20]
        ]

        # Cache
        await self.collection.update_one(
            {"domain": domain},
            {"$set": profile},
            upsert=True,
        )

        return profile

    async def get_new_lost_backlinks(self, domain: str) -> dict:
        """Get new and lost backlinks from DataForSEO (last 30 days)."""
        domain = domain.lower().strip().replace("https://", "").replace("http://", "").rstrip("/")
        
        result = await DataForSEOClient.get_new_lost_backlinks(domain)
        
        if result.get("success") and result.get("data"):
            data = result["data"]
            new_bls = data.get("new_backlinks", [])
            lost_bls = data.get("lost_backlinks", [])
            
            # Normalize items to consistent format
            def _normalize_bl(item):
                return {
                    "url_from": item.get("url_from", ""),
                    "url_to": item.get("url_to", ""),
                    "anchor": item.get("anchor", ""),
                    "domain_from": item.get("domain_from", ""),
                    "domain_from_rank": item.get("domain_from_rank", 0),
                    "dofollow": item.get("dofollow", True),
                    "first_seen": item.get("first_seen", ""),
                    "last_seen": item.get("last_seen", ""),
                }
            
            return {
                "domain": domain,
                "new_backlinks": [_normalize_bl(bl) for bl in (new_bls if isinstance(new_bls, list) else [])],
                "lost_backlinks": [_normalize_bl(bl) for bl in (lost_bls if isinstance(lost_bls, list) else [])],
                "new_count": len(new_bls) if isinstance(new_bls, list) else 0,
                "lost_count": len(lost_bls) if isinstance(lost_bls, list) else 0,
                "data_source": result.get("source", "dataforseo"),
            }
        
        # Fallback: return empty but structured response
        return {
            "domain": domain,
            "new_backlinks": [],
            "lost_backlinks": [],
            "new_count": 0,
            "lost_count": 0,
            "data_source": "unavailable",
            "note": "DataForSEO API key required for real data",
        }

    async def get_backlink_gap(self, primary: str, competitor: str) -> dict:
        """Analyze backlink gaps between two domains."""
        result = await DataForSEOClient.get_backlink_gap(primary, competitor)
        
        if result["success"]:
            return {
                "primary": primary,
                "competitor": competitor,
                "gap_data": result["data"],
                "data_source": result.get("source", "dataforseo"),
            }
            
        return {
            "primary": primary,
            "competitor": competitor,
            "gap_data": [],
            "data_source": "unavailable",
        }
