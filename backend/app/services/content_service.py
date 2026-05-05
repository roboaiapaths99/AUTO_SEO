"""
AutoSEO AI Platform — Content Service (REAL)
==============================================
Real content analysis and optimization using:
 1. NLP readability metrics (textstat — FREE)
 2. Gemini AI for content scoring and suggestions
 3. SERP competitor content analysis
"""

from typing import List, Dict, Any
from datetime import datetime, timezone

from app.core.api_clients import GeminiClient, GoogleSearchClient, get_http_client
from bs4 import BeautifulSoup
import logging

logger = logging.getLogger(__name__)


class ContentService:
    def __init__(self, db):
        self.db = db

    async def analyze_content(self, text: str, target_keyword: str) -> dict:
        """
        Real content analysis combining NLP metrics + AI analysis.
        """
        word_count = len(text.split())
        keyword_count = text.lower().count(target_keyword.lower())
        keyword_density = (keyword_count / max(word_count, 1)) * 100

        # ── 1. Readability metrics (textstat) ──
        readability = self._get_readability_scores(text)

        # ── 2. Basic SEO content checks ──
        seo_checks = {
            "word_count": word_count,
            "keyword_count": keyword_count,
            "keyword_density": round(keyword_density, 2),
            "has_keyword_in_first_100_words": target_keyword.lower() in " ".join(text.split()[:100]).lower(),
            "paragraph_count": text.count("\n\n") + 1,
            "sentence_count": text.count(".") + text.count("!") + text.count("?"),
            "avg_sentence_length": word_count / max(text.count(".") + text.count("!") + text.count("?"), 1),
        }

        # ── 3. Calculate score ──
        score = 0
        if 800 <= word_count <= 2500:
            score += 25
        elif 300 <= word_count < 800:
            score += 15
        elif word_count > 2500:
            score += 20

        if 1.0 <= keyword_density <= 2.5:
            score += 25
        elif 0.5 <= keyword_density < 1.0:
            score += 15

        if seo_checks["has_keyword_in_first_100_words"]:
            score += 15

        if readability.get("flesch_reading_ease", 0) >= 60:
            score += 15

        if seo_checks["avg_sentence_length"] <= 20:
            score += 10
        
        if seo_checks["paragraph_count"] >= 5:
            score += 10

        # ── 4. Generate suggestions ──
        suggestions = []
        if word_count < 800:
            suggestions.append(f"Content is thin ({word_count} words). Aim for 800-2000 words for better rankings.")
        if keyword_density < 0.5:
            suggestions.append(f"Keyword density is low ({keyword_density:.1f}%). Include '{target_keyword}' more naturally.")
        elif keyword_density > 3.0:
            suggestions.append(f"Keyword density is high ({keyword_density:.1f}%). Reduce to avoid keyword stuffing.")
        if not seo_checks["has_keyword_in_first_100_words"]:
            suggestions.append(f"Include '{target_keyword}' in the first 100 words of your content.")
        if seo_checks["avg_sentence_length"] > 25:
            suggestions.append("Sentences are too long on average. Keep them under 20 words for readability.")
        if readability.get("flesch_reading_ease", 100) < 50:
            suggestions.append("Content is difficult to read. Simplify language for wider audience reach.")

        # ── 5. AI-powered analysis (if Gemini available) ──
        ai_analysis = None
        try:
            ai_result = await GeminiClient.analyze_seo_content(text[:3000], target_keyword)
            if ai_result.get("success"):
                ai_analysis = ai_result.get("analysis")
        except Exception as e:
            logger.warning(f"AI analysis failed: {e}")

        return {
            "score": min(score, 100),
            "word_count": word_count,
            "keyword_density": round(keyword_density, 2),
            "readability": readability,
            "seo_checks": seo_checks,
            "suggestions": suggestions,
            "ai_analysis": ai_analysis,
            "analyzed_at": datetime.now(timezone.utc),
        }

    def _get_readability_scores(self, text: str) -> dict:
        """Calculate readability scores using textstat."""
        try:
            import textstat
            return {
                "flesch_reading_ease": textstat.flesch_reading_ease(text),
                "flesch_kincaid_grade": textstat.flesch_kincaid_grade(text),
                "gunning_fog": textstat.gunning_fog(text),
                "smog_index": textstat.smog_index(text),
                "coleman_liau_index": textstat.coleman_liau_index(text),
                "reading_time_minutes": round(len(text.split()) / 250, 1),
            }
        except ImportError:
            return {"reading_time_minutes": round(len(text.split()) / 250, 1)}

    async def generate_content_brief(self, keyword: str) -> dict:
        """
        Analyze top SERP results to create a content brief.
        This is a REAL feature — scrapes top-ranking pages.
        """
        serp = await GoogleSearchClient.search(keyword, num=10)
        if not serp["success"]:
            return {"keyword": keyword, "error": "Could not fetch SERP"}

        # Analyze top results
        competitor_data = []
        client = await get_http_client()

        for result in serp.get("results", [])[:5]:
            try:
                resp = await client.get(result["url"], timeout=10.0, follow_redirects=True)
                if resp.status_code == 200 and "text/html" in resp.headers.get("content-type", ""):
                    soup = BeautifulSoup(resp.text, "lxml")
                    text = soup.get_text(separator=" ", strip=True)
                    headings = [h.get_text(strip=True) for h in soup.find_all(["h1", "h2", "h3"])]

                    competitor_data.append({
                        "url": result["url"],
                        "title": result.get("title", ""),
                        "word_count": len(text.split()),
                        "headings": headings[:15],
                    })
            except Exception:
                continue

        # Aggregate insights
        avg_word_count = int(sum(c["word_count"] for c in competitor_data) / max(len(competitor_data), 1))
        all_headings = []
        for c in competitor_data:
            all_headings.extend(c["headings"])

        # Common heading themes
        common_subtopics = list(set(h.lower() for h in all_headings if len(h) > 5))[:20]

        brief = {
            "keyword": keyword,
            "target_word_count": max(avg_word_count, 800),
            "avg_competitor_word_count": avg_word_count,
            "competitors_analyzed": len(competitor_data),
            "suggested_headings": common_subtopics[:10],
            "serp_titles": [r.get("title", "") for r in serp.get("results", [])[:5]],
            "title_suggestion": f"The Ultimate Guide to {keyword.title()} in {datetime.now().year}",
            "meta_description_suggestion": f"Discover everything about {keyword}. Our comprehensive guide covers tips, strategies, and expert insights to help you succeed.",
            "created_at": datetime.now(timezone.utc),
        }

        # AI-enhanced brief (if Gemini available)
        try:
            ai_result = await GeminiClient.generate(
                f"Create a detailed content outline for an article targeting the keyword '{keyword}'. "
                f"The article should be about {avg_word_count} words. "
                f"Include: title, meta description, H2 headings, key points under each heading. "
                f"Format as a structured outline.",
                max_tokens=1500,
            )
            if ai_result.get("success"):
                brief["ai_outline"] = ai_result["text"]
        except Exception:
            pass

        # Save to DB
        await self.db.content_briefs.update_one(
            {"keyword": keyword},
            {"$set": brief},
            upsert=True,
        )

        return brief

    async def generate_seo_content(self, keyword: str, content_type: str = "blog_post") -> dict:
        """Generate SEO-optimized content using Gemini AI."""
        prompt = f"""Write a comprehensive, SEO-optimized {content_type.replace('_', ' ')} targeting the keyword "{keyword}".

Requirements:
- Include the keyword naturally in the title, first paragraph, and throughout
- Use H2 and H3 headings with keyword variations
- Write 1000-1500 words
- Include a compelling introduction and conclusion
- Use short paragraphs and sentences for readability
- Include actionable tips and examples
- Write in a professional but engaging tone

Output the content in markdown format."""

        result = await GeminiClient.generate(prompt, max_tokens=3000)
        if result["success"]:
            return {
                "keyword": keyword,
                "content_type": content_type,
                "content": result["text"],
                "generated_at": datetime.now(timezone.utc),
            }
        return {"keyword": keyword, "error": "Content generation failed", "detail": result.get("error", "")}
