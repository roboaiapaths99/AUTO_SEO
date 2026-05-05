"""
AutoSEO AI Platform — AIO (AI Optimization) Service
===================================================
Service for detecting AI hallucinations and generating correction schema.
"""

import json
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.services.ai_service import GeminiClient
from app.models.aio import VerifiedBrandData, AIMention, AIOCorrection

class AIOService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.gemini = GeminiClient()

    async def get_verified_data(self, project_id: str) -> Optional[VerifiedBrandData]:
        data = await self.db.verified_brand_data.find_one({"project_id": project_id})
        return VerifiedBrandData(**data) if data else None

    async def upsert_verified_data(self, project_id: str, brand_data: Dict[str, Any]):
        brand_data["project_id"] = project_id
        brand_data["last_updated"] = datetime.now(timezone.utc)
        await self.db.verified_brand_data.update_one(
            {"project_id": project_id},
            {"$set": brand_data},
            upsert=True
        )
        return True

    async def probe_ai_for_hallucinations(self, project_id: str, custom_query: Optional[str] = None):
        """Probes the AI to see what it knows (or hallucinates) about the brand."""
        verified = await self.get_verified_data(project_id)
        
        if custom_query:
            prompt = custom_query
        elif not verified:
            # Fallback if no specific query or verified data
            prompt = f"Tell me everything you know about the project with ID {project_id}. Focus on its core offerings and leadership."
        else:
            prompt = f"""
            I want to verify what you know about {verified.official_name}. 
            Please provide details on its founding, leadership, and main products.
            """

        # Add context if verified data exists but DO NOT tell AI you are checking it
        if verified:
            prompt += f"\n\nContext for analysis (Verified Truth): {verified.official_name}, founded by {verified.founder_ceo}."

        resp_data = await self.gemini.generate(prompt)
        response_text = resp_data.get("text", "")
        
        # Analyze for hallucinations using Gemini itself
        analysis_prompt = f"""
        Compare this AI response about a brand with the verified truth.
        
        AI Response:
        {response_text}
        
        Verified Truth:
        - Name: {verified.official_name if verified else project_id}
        - Founding: {verified.founded_year if verified else 'Unknown'}
        - CEO: {verified.founder_ceo if verified else 'Unknown'}
        - Products: {', '.join(verified.key_products) if verified else 'Unknown'}
        
        TASK:
        1. Is the AI response accurate? (True/False)
        2. Identify specific hallucinations.
        3. Sentiment of the response.
        
        Return JSON:
        {{
            "is_accurate": bool,
            "hallucinations": "list of inaccuracies found",
            "sentiment": "positive/neutral/negative"
        }}
        """
        
        analysis_resp = await self.gemini.generate(analysis_prompt)
        analysis_json = analysis_resp.get("text", "")
        try:
            # Basic cleanup in case of markdown formatting
            if "```json" in analysis_json:
                analysis_json = analysis_json.split("```json")[1].split("```")[0].strip()
            analysis = json.loads(analysis_json)
        except:
            analysis = {"is_accurate": True, "hallucinations": "Could not analyze", "sentiment": "neutral"}

        mention = AIMention(
            project_id=project_id,
            model_name="Gemini-Pro (External Probe)",
            query=prompt,
            response_text=response_text,
            sentiment=analysis.get("sentiment", "neutral"),
            is_accurate=analysis.get("is_accurate", True),
            hallucination_details=analysis.get("hallucinations")
        )

        await self.db.ai_mentions.insert_one(mention.model_dump())
        
        # If inaccurate, generate correction schema
        if not mention.is_accurate:
            await self.generate_correction_schema(project_id, verified)

        return mention

    async def generate_correction_schema(self, project_id: str, verified: VerifiedBrandData):
        """Generates Organization JSON-LD to fix AI hallucinations."""
        schema = {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": verified.official_name,
            "url": f"https://{verified.project_id}", # Simplified
            "foundingDate": str(verified.founded_year),
            "founder": {
                "@type": "Person",
                "name": verified.founder_ceo
            },
            "description": verified.mission_statement
        }
        
        correction = AIOCorrection(
            project_id=project_id,
            type="organization",
            schema_json=schema
        )
        
        await self.db.aio_corrections.insert_one(correction.model_dump())
        return correction

    async def get_mentions(self, project_id: str) -> List[AIMention]:
        cursor = self.db.ai_mentions.find({"project_id": project_id}).sort("detected_at", -1)
        mentions = await cursor.to_list(length=20)
        return [AIMention(**m) for m in mentions]
