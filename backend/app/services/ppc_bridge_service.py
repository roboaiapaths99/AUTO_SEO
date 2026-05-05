"""
AutoSEO AI Platform — Competitor PPC Bridge Service
===================================================
Identifies opportunities to steal competitor paid traffic organically.
"""

from typing import List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.services.ai_service import GeminiClient
from app.services.competitor_service import CompetitorService

class PPCBridgeService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.competitor_service = CompetitorService(db)
        self.gemini = GeminiClient()

    async def get_ppc_opportunities(self, project_id: str, domain: str, competitors: List[str] = None):
        """Analyzes competitors and finds PPC-to-SEO opportunities."""
        # 1. Discover competitors if they don't know any
        if not competitors:
            competitors = await self.competitor_service.discover_competitors(domain)
        
        # 2. In a real enterprise app, we'd fetch actual PPC ads from DataForSEO
        # For this implementation, we use Gemini to identify high-intent keywords 
        # where these specific competitors are likely spending heavily.
        
        prompt = f"""
        Analyze these competitors for the domain {domain}: {', '.join(competitors)}.
        
        TASK:
        1. List 5 high-intent, high-CPC keywords these competitors are likely bidding on in Google Ads.
        2. For each keyword, estimate their average CPC and why it's a valuable target for an organic SEO "takeover".
        
        Return the response as a structured JSON:
        {{
            "competitors_analyzed": {competitors},
            "opportunities": [
                {{
                    "keyword": "example keyword",
                    "est_cpc": "$4.50",
                    "intent": "Transactional/Commercial",
                    "strategy": "How to beat them organically",
                    "potential_savings": "$1,200/mo"
                }},
                ...
            ]
        }}
        """
        
        plan_data = await self.gemini.generate(prompt)
        response_text = plan_data.get("text", "")
        
        try:
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()
                
            import json
            data = json.loads(response_text)
            return data
        except:
            return {"error": "Failed to analyze PPC opportunities", "raw": response_text}
