"""
AutoSEO AI Platform — Keyword Service (REAL DATA)
===================================================
Real keyword research using:
 1. Google Custom Search API (FREE) — SERP analysis, related searches
 2. DataForSEO API (PAID fallback) — volume, difficulty, CPC
 3. Google autocomplete (FREE) — keyword suggestions
"""

from datetime import datetime, timezone
from typing import List, Dict, Any
import httpx
import hashlib
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.core.api_clients import GoogleSearchClient, DataForSEOClient, get_http_client
from app.models.schemas import StrategyReport, KeywordCluster

import logging
logger = logging.getLogger(__name__)


class KeywordService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.keywords

    async def get_keyword_data(self, keyword: str) -> dict:
        """
        Get real metrics for a single keyword.
        Uses DataForSEO if available, else structured estimation.
        """
        # Check cache first
        cached = await self.collection.find_one({"keyword": keyword.lower()})
        if cached:
            age = (datetime.now(timezone.utc) - cached.get("last_updated", datetime.min).replace(tzinfo=timezone.utc)).total_seconds()
            if age < 604800:  # 7 days cache
                cached.pop("_id", None)
                return cached

        # Fetch from DataForSEO (real or dummy)
        result = await DataForSEOClient.get_keyword_data([keyword])
        kw_data = {}
        if result["success"] and result.get("data"):
            d_list = result["data"]
            # Client already flattens to a list of items for keyword_data
            if isinstance(d_list, list) and len(d_list) > 0:
                d = d_list[0]
                kw_data = {
                    "keyword": keyword.lower(),
                    "volume": d.get("search_volume") or d.get("keyword_info", {}).get("search_volume", 0),
                    "difficulty": d.get("keyword_difficulty") or d.get("keyword_properties", {}).get("keyword_difficulty", 0),
                    "cpc": d.get("cpc", 0),
                    "competition": d.get("competition", 0),
                    "monthly_searches": d.get("monthly_searches") or d.get("keyword_info", {}).get("monthly_searches", []),
                    "data_source": result.get("source", "dataforseo"),
                    "last_updated": datetime.now(timezone.utc),
                }

        # Enrich with SERP data (free Google CSE)
        serp = await GoogleSearchClient.search(keyword, num=10)
        if serp["success"]:
            kw_data["serp_results"] = serp["results"][:5]
            kw_data["serp_total_results"] = serp.get("total_results", 0)

            # Estimate intent from SERP
            kw_data["intent"] = self._estimate_intent(keyword, serp["results"])

        # Cache in MongoDB
        if kw_data:
            await self.collection.update_one(
                {"keyword": keyword.lower()},
                {"$set": kw_data},
                upsert=True,
            )

        return kw_data

    async def get_keyword_suggestions(self, seed: str) -> List[dict]:
        """
        Get keyword suggestions using multiple free sources.
        1. Google Autocomplete (FREE, unlimited)
        2. DataForSEO suggestions (PAID or dummy)
        """
        suggestions = []
        seen = set()

        # ── Source 1: Google Autocomplete (FREE) ──────────
        autocomplete = await self._google_autocomplete(seed)
        for kw in autocomplete:
            if kw.lower() not in seen:
                seen.add(kw.lower())
                suggestions.append({"keyword": kw, "source": "autocomplete"})

        # ── Source 2: Question variations ────────────────
        question_prefixes = ["how to", "what is", "why", "best", "top"]
        for prefix in question_prefixes:
            q = f"{prefix} {seed}"
            ac = await self._google_autocomplete(q)
            for kw in ac[:3]:
                if kw.lower() not in seen:
                    seen.add(kw.lower())
                    suggestions.append({"keyword": kw, "source": "questions"})

        # ── Source 3: DataForSEO suggestions (real or dummy) ──
        dfs = await DataForSEOClient.get_keyword_suggestions(seed)
        if dfs["success"] and dfs.get("data"):
            data_items = dfs["data"]
            # Client already handles nesting for us now
            if isinstance(data_items, list):
                for item in data_items:
                    kw = item.get("keyword", "")
                    if kw.lower() not in seen:
                        seen.add(kw.lower())
                        
                        # Extremely safe nested access
                        k_info = item.get("keyword_info")
                        if not isinstance(k_info, dict): k_info = {}
                        
                        k_prop = item.get("keyword_properties")
                        if not isinstance(k_prop, dict): k_prop = {}
                        
                        suggestions.append({
                            "keyword": kw,
                            "volume": item.get("search_volume") or k_info.get("search_volume", 0),
                            "difficulty": item.get("keyword_difficulty") or k_prop.get("keyword_difficulty", 0),
                            "cpc": item.get("cpc", 0),
                            "competition": item.get("competition", 0),
                            "source": dfs.get("source", "dataforseo"),
                        })

        # Enrich autocomplete keywords with volume data
        for i, s in enumerate(suggestions):
            if "volume" not in s:
                dfs_data = await DataForSEOClient.get_keyword_data([s["keyword"]])
                if dfs_data["success"] and dfs_data.get("data"):
                    d = dfs_data["data"][0] if isinstance(dfs_data["data"], list) else dfs_data["data"]
                    suggestions[i]["volume"] = d.get("search_volume", 0)
                    suggestions[i]["difficulty"] = d.get("keyword_difficulty", 0)
                    suggestions[i]["cpc"] = d.get("cpc", 0)
                    suggestions[i]["competition"] = d.get("competition", 0)
            # Stop after 20 to avoid too many API calls
            if i >= 19:
                break

        return suggestions[:30]

    async def _google_autocomplete(self, query: str) -> List[str]:
        """
        Google Autocomplete API — FREE, no API key needed.
        Returns real search suggestions from Google.
        """
        client = await get_http_client()
        try:
            resp = await client.get(
                "https://suggestqueries.google.com/complete/search",
                params={"q": query, "client": "firefox", "hl": "en"},
                timeout=5.0,
            )
            if resp.status_code == 200:
                data = resp.json()
                return data[1] if len(data) > 1 else []
        except Exception as e:
            logger.warning(f"Autocomplete error for '{query}': {e}")
        return []

    def _estimate_intent(self, keyword: str, serp_results: List[dict]) -> str:
        """Estimate search intent from keyword and SERP results."""
        kw = keyword.lower()

        # Commercial intent signals
        commercial = ["buy", "price", "pricing", "cheap", "deal", "discount", "coupon", "best", "top", "review", "vs", "compare"]
        if any(w in kw for w in commercial):
            return "commercial"

        # Transactional intent signals
        transactional = ["order", "purchase", "subscribe", "download", "sign up", "register", "book"]
        if any(w in kw for w in transactional):
            return "transactional"

        # Navigational intent signals
        navigational = ["login", "sign in", "official", "website", ".com", ".org"]
        if any(w in kw for w in navigational):
            return "navigational"

        # Default: informational
        return "informational"

    async def get_serp_analysis(self, keyword: str) -> dict:
        """Get detailed SERP analysis for a keyword."""
        serp = await GoogleSearchClient.search(keyword, num=10)
        if not serp["success"]:
            return {"keyword": keyword, "error": "SERP fetch failed"}

        results = serp.get("results", [])

        # Analyze SERP composition
        domains_list = [r.get("domain", "") for r in results]
        avg_title_len = sum(len(r.get("title", "")) for r in results) / max(len(results), 1)
        avg_snippet_len = sum(len(r.get("snippet", "")) for r in results) / max(len(results), 1)

        return {
            "keyword": keyword,
            "total_results": serp.get("total_results", 0),
            "top_10_results": results,
            "top_domains": domains_list,
            "avg_title_length": round(avg_title_len),
            "avg_snippet_length": round(avg_snippet_len),
            "intent": self._estimate_intent(keyword, results),
            "analyzed_at": datetime.now(timezone.utc),
        }

    async def generate_strategy(self, project_id: str, keywords: List[str]) -> StrategyReport:
        """Generate a keyword strategy with real data clustering."""
        # Fetch data for all keywords
        keyword_data = []
        for kw in keywords[:20]:  # Limit to 20
            data = await self.get_keyword_data(kw)
            if data:
                keyword_data.append(data)

        # Cluster by intent
        intent_clusters = {}
        for kd in keyword_data:
            intent = kd.get("intent", "informational")
            if intent not in intent_clusters:
                intent_clusters[intent] = []
            intent_clusters[intent].append(kd)

        clusters = []
        for intent, kws in intent_clusters.items():
            clusters.append(
                KeywordCluster(
                    topic=f"{intent.capitalize()} Keywords",
                    keywords=[k["keyword"] for k in kws],
                    total_volume=sum(k.get("volume", 0) for k in kws),
                    average_difficulty=int(sum(k.get("difficulty", 0) for k in kws) / max(len(kws), 1)),
                    intent=intent,
                )
            )

        report = StrategyReport(
            project_id=ObjectId(project_id),
            seed_keyword=keywords[0] if keywords else "unknown",
            clusters=clusters,
            created_at=datetime.now(timezone.utc),
        )

        await self.db.strategies.insert_one(report.dict(by_alias=True))
        return report
