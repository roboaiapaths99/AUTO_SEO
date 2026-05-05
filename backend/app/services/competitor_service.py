"""
AutoSEO AI Platform — Competitor Service (REAL)
================================================
Handles competitor discovery and head-to-head SEO analysis.
"""

from typing import List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.services.domain_service import DomainService
from app.models.schemas import DomainData
from app.core.api_clients import DataForSEOClient
import logging
import json

logger = logging.getLogger(__name__)


class CompetitorService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.domain_service = DomainService(db)

    async def compare_domains(self, domains: List[str]) -> List[DomainData]:
        """Compare multiple domains side-by-side using real domain metrics."""
        results = []
        for domain in domains:
            try:
                data = await self.domain_service.get_domain_overview(domain)
                results.append(data)
            except Exception as e:
                logger.warning(f"Failed to fetch data for {domain}: {e}")
        return results

    async def compare_two_domains(self, domain_a: str, domain_b: str) -> dict:
        """Detailed head-to-head comparison between two domains."""
        data_a = await self.domain_service.get_domain_overview(domain_a)
        data_b = await self.domain_service.get_domain_overview(domain_b)
        
        # Real metrics comparison
        return {
            "domain_a": domain_a,
            "domain_b": domain_b,
            "metrics": {
                "organic_traffic": {
                    "a": data_a.get("organic_traffic", 0), 
                    "b": data_b.get("organic_traffic", 0),
                    "winner": "a" if data_a.get("organic_traffic", 0) > data_b.get("organic_traffic", 0) else "b"
                },
                "organic_keywords": {
                    "a": data_a.get("organic_keywords", 0), 
                    "b": data_b.get("organic_keywords", 0),
                    "winner": "a" if data_a.get("organic_keywords", 0) > data_b.get("organic_keywords", 0) else "b"
                },
                "backlinks": {
                    "a": data_a.get("backlinks_count", 0), 
                    "b": data_b.get("backlinks_count", 0),
                    "winner": "a" if data_a.get("backlinks_count", 0) > data_b.get("backlinks_count", 0) else "b"
                },
                "domain_authority": {
                    "a": data_a.get("authority_score", 0), 
                    "b": data_b.get("authority_score", 0),
                    "winner": "a" if data_a.get("authority_score", 0) > data_b.get("authority_score", 0) else "b"
                },
            },
            "crawled_at": data_a.get("last_updated")
        }

    async def discover_competitors(self, domain: str) -> List[str]:
        """Use Gemini AI to discover top SEO competitors for a given domain."""
        from app.services.ai_service import GeminiClient
        gemini = GeminiClient()
        
        prompt = f"""
        Identify the top 5 direct business and SEO competitors for the domain: {domain}.
        Focus on companies that compete for the same organic search traffic.
        
        Return the response as a valid JSON list of strings (domain names only).
        Example: ["competitor1.com", "competitor2.com"]
        """
        
        response_data = await gemini.generate(prompt)
        try:
            if response_data["success"]:
                text = response_data["text"]
                if "```json" in text:
                    text = text.split("```json")[1].split("```")[0].strip()
                elif "```" in text:
                    text = text.split("```")[1].split("```")[0].strip()
                competitors = json.loads(text)
                return competitors if isinstance(competitors, list) else []
            return ["google.com", "bing.com"]
        except:
            # Fallback if AI fails
            return ["google.com", "bing.com"] # Very generic fallback

    async def get_keyword_gap(self, primary_domain: str, competitors: List[str]) -> dict:
        """
        Analyze keyword gaps. 
        Uses DataForSEO Keyword Gap API if configured, else smarter simulation.
        """
        result = await DataForSEOClient.get_keyword_gap(primary_domain, competitors)
        
        if result["success"]:
            return result["data"]

        return {
            "primary": primary_domain,
            "competitors": competitors,
            "status": "error",
            "message": result.get("error", "Unknown error"),
            "gap_keywords": []
        }
