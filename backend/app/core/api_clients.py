"""
AutoSEO AI Platform — External API Clients
============================================
Centralized clients for all external SEO data APIs.
Each client handles auth, rate limiting, retries, and error handling.
"""

import httpx
import base64
import logging
import asyncio
from typing import Optional, Dict, Any, List
from app.core.config import settings

logger = logging.getLogger(__name__)

# ── Shared HTTP client (connection pooling) ──────────────
_http_client: Optional[httpx.AsyncClient] = None


async def get_http_client() -> httpx.AsyncClient:
    """Get or create a shared async HTTP client."""
    global _http_client
    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.AsyncClient(
            timeout=httpx.Timeout(30.0),
            follow_redirects=True,
            headers={"User-Agent": settings.CRAWLER_USER_AGENT},
        )
    return _http_client


async def close_http_client():
    """Close the shared HTTP client."""
    global _http_client
    if _http_client and not _http_client.is_closed:
        await _http_client.aclose()
        _http_client = None


# =====================================================================
#  Google PageSpeed Insights API (FREE)
# =====================================================================
class PageSpeedClient:
    """
    Google PageSpeed Insights API — FREE, unlimited.
    Provides: performance score, Core Web Vitals (LCP, FID, CLS),
    accessibility score, SEO score, best practices score.
    Docs: https://developers.google.com/speed/docs/insights/v5/get-started
    """
    BASE_URL = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"

    @staticmethod
    async def analyze(url: str, strategy: str = "desktop") -> Dict[str, Any]:
        """
        Run PageSpeed analysis on a URL.
        strategy: 'desktop' or 'mobile'
        """
        client = await get_http_client()
        params = {
            "url": url if url.startswith("http") else f"https://{url}",
            "strategy": strategy,
            "category": ["performance", "accessibility", "seo", "best-practices"],
        }
        if settings.has_google_psi:
            params["key"] = settings.GOOGLE_PSI_API_KEY

        try:
            resp = await client.get(PageSpeedClient.BASE_URL, params=params)
            resp.raise_for_status()
            data = resp.json()

            # Extract scores
            categories = data.get("lighthouseResult", {}).get("categories", {})
            audits = data.get("lighthouseResult", {}).get("audits", {})

            # Core Web Vitals from field data
            field_data = data.get("loadingExperience", {}).get("metrics", {})

            return {
                "scores": {
                    "performance": int((categories.get("performance", {}).get("score", 0) or 0) * 100),
                    "accessibility": int((categories.get("accessibility", {}).get("score", 0) or 0) * 100),
                    "seo": int((categories.get("seo", {}).get("score", 0) or 0) * 100),
                    "best_practices": int((categories.get("best-practices", {}).get("score", 0) or 0) * 100),
                },
                "core_web_vitals": {
                    "lcp": field_data.get("LARGEST_CONTENTFUL_PAINT_MS", {}).get("percentile"),
                    "fid": field_data.get("FIRST_INPUT_DELAY_MS", {}).get("percentile"),
                    "cls": field_data.get("CUMULATIVE_LAYOUT_SHIFT_SCORE", {}).get("percentile"),
                    "inp": field_data.get("INTERACTION_TO_NEXT_PAINT", {}).get("percentile"),
                    "fcp": field_data.get("FIRST_CONTENTFUL_PAINT_MS", {}).get("percentile"),
                    "ttfb": field_data.get("EXPERIMENTAL_TIME_TO_FIRST_BYTE", {}).get("percentile"),
                },
                "audits": {
                    "meta_description": audits.get("meta-description", {}).get("score"),
                    "document_title": audits.get("document-title", {}).get("score"),
                    "viewport": audits.get("viewport", {}).get("score"),
                    "robots_txt": audits.get("robots-txt", {}).get("score"),
                    "canonical": audits.get("canonical", {}).get("score"),
                    "hreflang": audits.get("hreflang", {}).get("score"),
                    "font_size": audits.get("font-size", {}).get("score"),
                    "link_text": audits.get("link-text", {}).get("score"),
                    "crawlable_anchors": audits.get("crawlable-anchors", {}).get("score"),
                    "is_crawlable": audits.get("is-crawlable", {}).get("score"),
                    "image_alt": audits.get("image-alt", {}).get("score"),
                    "http_status_code": audits.get("http-status-code", {}).get("score"),
                },
                "strategy": strategy,
                "url": url,
                "success": True,
            }
        except httpx.HTTPStatusError as e:
            logger.error(f"PageSpeed API error for {url}: {e.response.status_code}")
            return {"success": False, "error": str(e), "url": url}
        except Exception as e:
            logger.error(f"PageSpeed API error for {url}: {e}")
            return {"success": False, "error": str(e), "url": url}


# =====================================================================
#  Google Custom Search API (FREE — 100 queries/day)
# =====================================================================
class GoogleSearchClient:
    """
    Google Custom Search JSON API — 100 free queries/day.
    Used for: SERP position checking, competitor discovery.
    Docs: https://developers.google.com/custom-search/v1/overview
    """
    BASE_URL = "https://www.googleapis.com/customsearch/v1"

    @staticmethod
    async def search(query: str, num: int = 10, start: int = 1) -> Dict[str, Any]:
        """Search Google and return SERP results."""
        if not settings.has_google_cse:
            return {"success": False, "error": "Google CSE API key not configured", "results": []}

        client = await get_http_client()
        params = {
            "q": query,
            "key": settings.GOOGLE_CSE_API_KEY,
            "cx": settings.GOOGLE_CSE_CX,
            "num": min(num, 10),
            "start": start,
        }

        try:
            resp = await client.get(GoogleSearchClient.BASE_URL, params=params)
            
            # If forbidden or quota exceeded, fall back to AI/Dummy
            if resp.status_code in [403, 429]:
                logger.warning(f"Google CSE returned {resp.status_code}. Falling back to AI/Dummy data.")
                return await GoogleSearchClient._fallback_search(query, start)
                
            resp.raise_for_status()
            data = resp.json()

            results = []
            for i, item in enumerate(data.get("items", []), start=start):
                results.append({
                    "position": i,
                    "title": item.get("title", ""),
                    "url": item.get("link", ""),
                    "snippet": item.get("snippet", ""),
                    "domain": item.get("displayLink", ""),
                })

            return {
                "success": True,
                "query": query,
                "total_results": int(data.get("searchInformation", {}).get("totalResults", 0)),
                "results": results,
                "source": "google"
            }
        except Exception as e:
            logger.error(f"Google CSE error for '{query}': {e}. Falling back.")
            return await GoogleSearchClient._fallback_search(query, start)

    @staticmethod
    async def _fallback_search(query: str, start: int = 1) -> Dict[str, Any]:
        """AI/Deterministic fallback for search results."""
        # Try Gemini first for "smart" results
        if settings.has_gemini:
            try:
                from app.core.api_clients import GeminiClient
                prompt = f"Generate a JSON list of 10 realistic search results for the keyword '{query}'. Include: title, url, snippet, domain. Return ONLY JSON."
                ai_resp = await GeminiClient.generate(prompt)
                if ai_resp["success"]:
                    import json
                    text = ai_resp["text"].strip()
                    if "```json" in text:
                        text = text.split("```json")[1].split("```")[0]
                    elif "```" in text:
                        text = text.split("```")[1].split("```")[0]
                    
                    ai_results = json.loads(text)
                    results = []
                    for i, item in enumerate(ai_results, start=start):
                        results.append({
                            "position": i,
                            "title": item.get("title", ""),
                            "url": item.get("url", ""),
                            "snippet": item.get("snippet", ""),
                            "domain": item.get("domain", ""),
                        })
                    return {
                        "success": True,
                        "query": query,
                        "total_results": 1000,
                        "results": results,
                        "source": "ai_simulated"
                    }
            except Exception as e:
                logger.error(f"AI Fallback failed: {e}")

        # Final hardcoded fallback
        import hashlib
        results = []
        domains = ["wikipedia.org", "forbes.com", "nytimes.com", "medium.com", "github.com", "reddit.com"]
        for i in range(start, start + 10):
            seed = int(hashlib.md5(f"{query}-{i}".encode()).hexdigest()[:8], 16)
            domain = domains[seed % len(domains)]
            results.append({
                "position": i,
                "title": f"The Ultimate Guide to {query} | {domain.capitalize()}",
                "url": f"https://{domain}/{query.replace(' ', '-')}-guide",
                "snippet": f"Learn everything about {query} including latest trends, expert tips, and professional strategies for 2026.",
                "domain": domain,
            })
        
        return {
            "success": True,
            "query": query,
            "total_results": 500,
            "results": results,
            "source": "dummy_deterministic"
        }

    @staticmethod
    async def find_domain_position(query: str, target_domain: str) -> Dict[str, Any]:
        """Find where a specific domain ranks for a keyword."""
        # Check first 100 results (10 pages)
        for start in range(1, 101, 10):
            serp = await GoogleSearchClient.search(query, num=10, start=start)
            if not serp["success"]:
                break
            for result in serp["results"]:
                if target_domain.lower() in result["domain"].lower():
                    return {
                        "found": True,
                        "position": result["position"],
                        "url": result["url"],
                        "title": result["title"],
                    }
        return {"found": False, "position": None, "url": None}


# =====================================================================
#  DataForSEO API Client (PAID — Placeholder for later)
# =====================================================================
class DataForSEOClient:
    """
    DataForSEO API — $0.01-0.05 per request.
    Covers: keyword data, backlinks, domain analytics, SERP.
    When API keys are not set, returns structured dummy data.
    Docs: https://docs.dataforseo.com/
    """
    BASE_URL = "https://api.dataforseo.com/v3"

    @staticmethod
    def _get_auth_header() -> Dict[str, str]:
        creds = f"{settings.DATAFORSEO_LOGIN}:{settings.DATAFORSEO_PASSWORD}"
        encoded = base64.b64encode(creds.encode()).decode()
        return {"Authorization": f"Basic {encoded}"}

    @staticmethod
    async def _post(endpoint: str, payload: List[Dict]) -> Dict[str, Any]:
        """Make a POST request to DataForSEO API."""
        if not settings.has_dataforseo:
            return {"success": False, "error": "DataForSEO credentials not configured", "data": None}

        client = await get_http_client()
        try:
            resp = await client.post(
                f"{DataForSEOClient.BASE_URL}{endpoint}",
                json=payload,
                headers=DataForSEOClient._get_auth_header(),
            )
            
            if resp.status_code == 402:
                logger.warning("DataForSEO: Payment Required (402). Your account balance might be zero.")
                return {"success": False, "error": "Insufficient balance", "status_code": 402, "simulated": True, "data": None}
            
            if resp.status_code == 401:
                logger.error("DataForSEO: Unauthorized (401). Check your login and password.")
                return {"success": False, "error": "Invalid DataForSEO credentials", "status_code": 401, "data": None}

            resp.raise_for_status()
            data = resp.json()
            return {"success": True, "data": data}
        except httpx.HTTPStatusError as e:
            logger.error(f"DataForSEO HTTP error: {e.response.status_code} - {e.response.text}")
            return {"success": False, "error": f"API returned {e.response.status_code}", "status_code": e.response.status_code, "data": None}
        except Exception as e:
            logger.error(f"DataForSEO error: {e}")
            return {"success": False, "error": str(e), "data": None}

# =====================================================================
    @staticmethod
    def _extract_result(response: Dict[str, Any]) -> Optional[Any]:
        """Extract the actual result items from a DataForSEO raw response."""
        try:
            if not response or not response.get("success"):
                return None
            
            data = response.get("data", {})
            if not data or "tasks" not in data or not data["tasks"]:
                return None
            
            # DataForSEO responses are deeply nested: tasks -> result -> items
            task = data["tasks"][0]
            status_code = task.get("status_code")
            
            if status_code != 20000:
                logger.warning(f"DataForSEO task failed with code {status_code}: {task.get('status_message')}")
                return None
                
            result = task.get("result", [])
            if not result:
                return None
                
            # Most live endpoints return the data in result[0]
            # Some have 'items', some are just the result object itself
            res_obj = result[0]
            if res_obj and "items" in res_obj:
                return res_obj["items"]
            return res_obj
        except (KeyError, IndexError, TypeError) as e:
            logger.error(f"Error extracting DataForSEO result: {e}")
            return None

    @staticmethod
    async def get_keyword_data(keywords: List[str], location_code: int = 2840) -> Dict[str, Any]:
        """
        Get search volume, CPC, competition for keywords.
        """
        if not settings.has_dataforseo:
            return DataForSEOClient._dummy_keyword_data(keywords)

        payload = [{"keywords": keywords, "location_code": location_code, "language_code": "en"}]
        result = await DataForSEOClient._post("/keywords_data/google_ads/search_volume/live", payload)
        
        if not result["success"]:
            return DataForSEOClient._dummy_keyword_data(keywords)
            
        # Extract and flatten
        flattened = DataForSEOClient._extract_result(result)
        if not flattened:
            return DataForSEOClient._dummy_keyword_data(keywords)
            
        return {"success": True, "data": flattened, "source": "dataforseo"}

    @staticmethod
    async def get_keyword_suggestions(seed: str, location_code: int = 2840) -> Dict[str, Any]:
        """
        Get related keyword suggestions.
        """
        if not settings.has_dataforseo:
            return DataForSEOClient._dummy_keyword_suggestions(seed)

        payload = [{"keyword": seed, "location_code": location_code, "language_code": "en", "limit": 50}]
        result = await DataForSEOClient._post("/dataforseo_labs/google/keyword_suggestions/live", payload)
        
        if not result["success"]:
            return DataForSEOClient._dummy_keyword_suggestions(seed)
            
        flattened = DataForSEOClient._extract_result(result)
        if not flattened:
            return DataForSEOClient._dummy_keyword_suggestions(seed)
            
        return {"success": True, "data": flattened, "source": "dataforseo"}

    @staticmethod
    async def get_backlinks(domain: str, limit: int = 100) -> Dict[str, Any]:
        """
        Get backlink profile for a domain.
        """
        if not settings.has_dataforseo:
            return DataForSEOClient._dummy_backlinks(domain)

        payload = [{"target": domain, "limit": limit, "mode": "as_is"}]
        result = await DataForSEOClient._post("/backlinks/backlinks/live", payload)
        
        if not result["success"]:
            dummy = DataForSEOClient._dummy_backlinks(domain)
            dummy["simulated"] = True
            dummy["reason"] = result.get("error", "API Error")
            return dummy
            
        flattened = DataForSEOClient._extract_result(result)
        if not flattened:
            dummy = DataForSEOClient._dummy_backlinks(domain)
            dummy["simulated"] = True
            return dummy
            
        return {"success": True, "data": flattened, "source": "dataforseo", "simulated": False}

    @staticmethod
    async def get_domain_metrics(domain: str) -> Dict[str, Any]:
        """
        Get domain authority, traffic estimates.
        """
        if not settings.has_dataforseo:
            return DataForSEOClient._dummy_domain_metrics(domain)

        payload = [{"target": domain, "language_code": "en", "location_code": 2840}]
        result = await DataForSEOClient._post("/dataforseo_labs/google/domain_rank_overview/live", payload)
        
        if not result["success"]:
            return DataForSEOClient._dummy_domain_metrics(domain)
            
        flattened = DataForSEOClient._extract_result(result)
        if not flattened:
            return DataForSEOClient._dummy_domain_metrics(domain)
            
        # Domain rank overview returns a list of 1 item in 'items'
        if isinstance(flattened, list) and len(flattened) > 0:
            flattened = flattened[0]
            
        return {"success": True, "data": flattened, "source": "dataforseo"}

    @staticmethod
    async def get_serp_data(keyword: str, location_code: int = 2840) -> Dict[str, Any]:
        """
        Get SERP results for a keyword.
        """
        if not settings.has_dataforseo:
            return DataForSEOClient._dummy_serp_data(keyword)

        payload = [{"keyword": keyword, "location_code": location_code, "language_code": "en", "device": "desktop"}]
        result = await DataForSEOClient._post("/serp/google/organic/live/advanced", payload)
        
        if not result["success"]:
            return DataForSEOClient._dummy_serp_data(keyword)
            
        flattened = DataForSEOClient._extract_result(result)
        if not flattened:
            return DataForSEOClient._dummy_serp_data(keyword)
            
        return {"success": True, "data": flattened, "source": "dataforseo"}

    @staticmethod
    async def get_traffic_trend(domain: str) -> Dict[str, Any]:
        """
        Get historical traffic estimates for a domain.
        """
        if not settings.has_dataforseo:
            return {"success": False, "error": "DataForSEO not configured"}

        # Use historical_rank_overview for trends
        payload = [{"target": domain, "language_code": "en", "location_code": 2840}]
        result = await DataForSEOClient._post("/dataforseo_labs/google/historical_rank_overview/live", payload)
        
        if not result["success"]:
            return result
            
        flattened = DataForSEOClient._extract_result(result)
        if not flattened:
            return {"success": False, "error": "No trend data found"}
            
        return {"success": True, "data": flattened, "source": "dataforseo"}

    @staticmethod
    async def get_keyword_gap(primary: str, competitors: List[str]) -> Dict[str, Any]:
        """
        Compare keywords between primary domain and competitors.
        Uses DataForSEO keyword_intersection endpoint.
        """
        if not settings.has_dataforseo:
            return DataForSEOClient._dummy_keyword_gap(primary, competitors)

        # Build targets dict: {1: primary, 2: comp1, 3: comp2, ...}
        targets = {str(i + 1): {"target": d, "target_type": "domain"} for i, d in enumerate([primary] + competitors[:2])}
        payload = [{"targets": targets, "language_code": "en", "location_code": 2840, "limit": 50}]
        result = await DataForSEOClient._post("/dataforseo_labs/google/domain_intersection/live", payload)
        
        if not result["success"]:
            return DataForSEOClient._dummy_keyword_gap(primary, competitors)
            
        flattened = DataForSEOClient._extract_result(result)
        if not flattened:
            return DataForSEOClient._dummy_keyword_gap(primary, competitors)
        
        gap_keywords = []
        if isinstance(flattened, list):
            for item in flattened:
                kw_data = item.get("keyword_data", {}) or {}
                ki = kw_data.get("keyword_info", {}) or {}
                intersections = item.get("intersection_result", {}) or {}
                primary_rank = None
                competitor_rank = None
                if "1" in intersections and intersections["1"]:
                    primary_rank = intersections["1"][0].get("rank_group") if isinstance(intersections["1"], list) else None
                if "2" in intersections and intersections["2"]:
                    competitor_rank = intersections["2"][0].get("rank_group") if isinstance(intersections["2"], list) else None
                gap_keywords.append({
                    "keyword": kw_data.get("keyword", ""),
                    "volume": ki.get("search_volume", 0),
                    "difficulty": (item.get("keyword_data", {}) or {}).get("keyword_properties", {}).get("keyword_difficulty", 0),
                    "cpc": ki.get("cpc", 0),
                    "primary_rank": primary_rank,
                    "competitor_rank": competitor_rank,
                })
        
        return {"success": True, "source": "dataforseo", "data": {"gap_keywords": gap_keywords, "shared_count": len(gap_keywords)}}

    @staticmethod
    async def get_backlink_gap(primary: str, competitor: str) -> Dict[str, Any]:
        """
        Compare backlinks between primary domain and one competitor.
        Uses DataForSEO backlink intersection endpoint.
        """
        if not settings.has_dataforseo:
            return DataForSEOClient._dummy_backlink_gap(primary, competitor)

        payload = [{"targets": [primary, competitor], "limit": 50, "mode": "as_is"}]
        result = await DataForSEOClient._post("/backlinks/domain_intersection/live", payload)
        
        if not result["success"]:
            return DataForSEOClient._dummy_backlink_gap(primary, competitor)
            
        flattened = DataForSEOClient._extract_result(result)
        if not flattened:
            return DataForSEOClient._dummy_backlink_gap(primary, competitor)

        results = []
        if isinstance(flattened, list):
            for item in flattened:
                results.append({
                    "domain": item.get("url_from_domain", ""),
                    "dr": item.get("domain_from_rank", 0),
                    "comp_links": item.get("is_intersecting", 0),
                    "your_links": 1 if primary in str(item.get("url_to", "")) else 0,
                })
        return {"success": True, "source": "dataforseo", "data": results}

    @staticmethod
    async def get_ranked_pages(domain: str, limit: int = 10) -> Dict[str, Any]:
        """
        Get top-performing pages for a domain via DataForSEO.
        Uses the ranked_keywords endpoint grouped by page.
        """
        if not settings.has_dataforseo:
            return DataForSEOClient._dummy_ranked_pages(domain)

        payload = [{"target": domain, "language_code": "en", "location_code": 2840, "limit": limit,
                     "order_by": ["ranked_serp_element.serp_item.etv,desc"]}]
        result = await DataForSEOClient._post("/dataforseo_labs/google/ranked_keywords/live", payload)
        
        if not result["success"]:
            return DataForSEOClient._dummy_ranked_pages(domain)
            
        flattened = DataForSEOClient._extract_result(result)
        if not flattened:
            return DataForSEOClient._dummy_ranked_pages(domain)
        
        pages = []
        if isinstance(flattened, list):
            seen_urls = set()
            for item in flattened:
                serp_item = item.get("ranked_serp_element", {}).get("serp_item", {}) or {}
                url = serp_item.get("relative_url") or serp_item.get("url", "")
                if url and url not in seen_urls:
                    seen_urls.add(url)
                    pages.append({
                        "url": url,
                        "keyword": item.get("keyword_data", {}).get("keyword", ""),
                        "traffic": serp_item.get("etv", 0),
                        "position": serp_item.get("rank_group", 0),
                        "volume": item.get("keyword_data", {}).get("keyword_info", {}).get("search_volume", 0),
                    })
        
        return {"success": True, "source": "dataforseo", "data": pages[:limit]}

    @staticmethod
    async def get_new_lost_backlinks(domain: str, limit: int = 50) -> Dict[str, Any]:
        """
        Get recently acquired and lost backlinks for a domain.
        """
        if not settings.has_dataforseo:
            return {"success": False, "error": "DataForSEO not configured", "data": None}
        
        from datetime import datetime, timedelta
        date_from = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        
        # New backlinks
        new_payload = [{"target": domain, "limit": limit, "mode": "as_is",
                        "date_from": date_from, "backlinks_status_type": "new"}]
        new_result = await DataForSEOClient._post("/backlinks/backlinks/live", new_payload)
        
        # Lost backlinks
        lost_payload = [{"target": domain, "limit": limit, "mode": "as_is",
                         "date_from": date_from, "backlinks_status_type": "lost"}]
        lost_result = await DataForSEOClient._post("/backlinks/backlinks/live", lost_payload)
        
        new_items = DataForSEOClient._extract_result(new_result) if new_result.get("success") else []
        lost_items = DataForSEOClient._extract_result(lost_result) if lost_result.get("success") else []
        
        return {
            "success": True,
            "source": "dataforseo",
            "data": {
                "new_backlinks": new_items or [],
                "lost_backlinks": lost_items or [],
            }
        }

    # ── Dummy data fallbacks (used when API key not set) ──

    @staticmethod
    def _dummy_keyword_data(keywords: List[str]) -> Dict[str, Any]:
        """Structured dummy data matching DataForSEO response format."""
        import hashlib
        results = []
        for kw in keywords:
            seed = int(hashlib.md5(kw.encode()).hexdigest()[:8], 16)
            results.append({
                "keyword": kw,
                "search_volume": (seed % 50000) + 100,
                "cpc": round((seed % 1500) / 100, 2),
                "competition": round((seed % 100) / 100, 2),
                "keyword_difficulty": (seed % 80) + 5,
                "monthly_searches": [
                    {"month": m, "search_volume": int(((seed % 50000) + 100) * (0.8 + (i * 0.03)))}
                    for i, m in enumerate(range(1, 13))
                ],
            })
        return {"success": True, "data": results, "source": "dummy"}

    @staticmethod
    def _dummy_keyword_suggestions(seed: str) -> Dict[str, Any]:
        suffixes = [
            "tips", "guide", "tools", "best", "vs", "pricing", "alternative",
            "tutorial", "examples", "strategy", "free", "for beginners",
            "software", "services", "course", "certification", "agency",
            "how to", "what is", "benefits",
        ]
        import hashlib
        results = []
        for suffix in suffixes:
            kw = f"{seed} {suffix}"
            h = int(hashlib.md5(kw.encode()).hexdigest()[:8], 16)
            results.append({
                "keyword": kw,
                "search_volume": (h % 30000) + 50,
                "cpc": round((h % 1000) / 100, 2),
                "competition": round((h % 100) / 100, 2),
                "keyword_difficulty": (h % 85) + 5,
            })
        return {"success": True, "data": results, "source": "dummy"}

    @staticmethod
    def _dummy_backlinks(domain: str) -> Dict[str, Any]:
        import hashlib
        seed = int(hashlib.md5(domain.encode()).hexdigest()[:8], 16)
        backlinks = []
        dummy_sources = [
            "techcrunch.com", "forbes.com", "medium.com", "dev.to",
            "reddit.com", "producthunt.com", "github.com", "twitter.com",
        ]
        for i, src in enumerate(dummy_sources):
            backlinks.append({
                "url_from": f"https://{src}/article-{seed % 1000 + i}",
                "url_to": f"https://{domain}/",
                "anchor": domain.split(".")[0],
                "anchor_text": domain.split(".")[0],
                "dofollow": i % 3 != 0,
                "is_nofollow": i % 3 == 0,
                "domain_authority": 40 + (seed % 50) + i,
                "first_seen": "2024-01-15",
            })
        return {
            "success": True,
            "source": "dummy",
            "simulated": True,
            "data": {
                "total_backlinks": (seed % 50000) + 500,
                "referring_domains": (seed % 5000) + 50,
                "backlinks": backlinks,
            },
        }

    @staticmethod
    def _dummy_domain_metrics(domain: str) -> Dict[str, Any]:
        import hashlib
        seed = int(hashlib.md5(domain.encode()).hexdigest()[:8], 16)
        return {
            "success": True,
            "source": "dummy",
            "data": {
                "domain": domain,
                "domain_rank": (seed % 80) + 10,
                "authority_score": (seed % 60) + 20,
                "organic_traffic": (seed % 500000) + 1000,
                "organic_keywords": (seed % 50000) + 100,
                "backlinks": (seed % 100000) + 500,
                "paid_traffic": (seed % 10000),
                "paid_keywords": (seed % 500),
                "top_keywords": [
                    {"keyword": f"{domain} reviews", "pos": 1, "volume": 1200, "traffic": 450, "difficulty": 25},
                    {"keyword": "best seo automation", "pos": 5, "volume": 25000, "traffic": 320, "difficulty": 65},
                    {"keyword": "ai backlink tool", "pos": 3, "volume": 5000, "traffic": 180, "difficulty": 45},
                    {"keyword": "technical audit software", "pos": 8, "volume": 12000, "traffic": 120, "difficulty": 55},
                    {"keyword": "competitor gap analysis", "pos": 12, "volume": 15000, "traffic": 90, "difficulty": 60},
                    {"keyword": "organic ranking tracker", "pos": 2, "volume": 8000, "traffic": 210, "difficulty": 40},
                ]
            },
        }

    @staticmethod
    def _dummy_serp_data(keyword: str) -> Dict[str, Any]:
        import hashlib
        seed = int(hashlib.md5(keyword.encode()).hexdigest()[:8], 16)
        items = []
        for i in range(1, 21):
            items.append({
                "type": "organic",
                "rank_group": i,
                "domain": f"competitor-{i}.com",
                "url": f"https://competitor-{i}.com/page-about-{keyword.replace(' ', '-')}",
                "title": f"Top Results for {keyword} | Site {i}",
                "description": f"This is a detailed guide about {keyword} ranking at position {i}."
            })
        
        # Inject our domain occasionally
        if seed % 3 == 0:
            items[seed % 10] = {
                "type": "organic",
                "rank_group": (seed % 10) + 1,
                "domain": "autoseo.ai",
                "url": "https://autoseo.ai/",
                "title": f"AutoSEO AI | Best {keyword} Solution",
                "description": "The ultimate platform for SEO automation and rank tracking."
            }
            
        return {
            "success": True,
            "source": "dummy",
            "data": {"items": items}
        }
    @staticmethod
    def _dummy_keyword_gap(primary: str, competitors: List[str]) -> Dict[str, Any]:
        import hashlib
        seed = int(hashlib.md5(primary.encode()).hexdigest()[:8], 16)
        
        keywords = ["seo strategy", "ai marketing", "rank tracker", "backlink checker", "site audit tool", 
                    "organic search", "content optimization", "keyword research", "serp analysis", "technical seo"]
        
        gap_keywords = []
        for i, kw in enumerate(keywords):
            h = int(hashlib.md5(f"{kw}-{i}".encode()).hexdigest()[:8], 16)
            gap_keywords.append({
                "keyword": kw,
                "volume": (h % 5000) + 500,
                "difficulty": (h % 70) + 10,
                "cpc": round((h % 1000) / 100, 2),
                "primary_rank": (seed % 100) + 1 if i % 4 != 0 else None,
                "competitor_rank": (h % 10) + 1,
            })
            
        return {
            "success": True,
            "source": "dummy",
            "data": {
                "shared_count": (seed % 200) + 50,
                "missing_count": (seed % 100) + 20,
                "gap_keywords": gap_keywords
            }
        }

    @staticmethod
    def _dummy_backlink_gap(primary: str, competitor: str) -> Dict[str, Any]:
        import hashlib
        seed = int(hashlib.md5(f"{primary}-{competitor}".encode()).hexdigest()[:8], 16)
        
        domains = ["techcrunch.com", "forbes.com", "medium.com", "dev.to", "github.com", 
                   "reddit.com", "producthunt.com", "nytimes.com", "wired.com", "theverge.com"]
        
        results = []
        for i, domain in enumerate(domains):
            h = int(hashlib.md5(domain.encode()).hexdigest()[:8], 16)
            results.append({
                "domain": domain,
                "dr": (h % 60) + 40,
                "comp_links": (h % 20) + 1,
                "your_links": (seed % 2) if i % 3 != 0 else 0,
            })
            
        return {
            "success": True,
            "source": "dummy",
            "data": results
        }

    @staticmethod
    def _dummy_ranked_pages(domain: str) -> Dict[str, Any]:
        """Dummy ranked pages data for when DataForSEO is unavailable."""
        import hashlib
        seed = int(hashlib.md5(domain.encode()).hexdigest()[:8], 16)
        base_traffic = (seed % 50000) + 1000
        pages = [
            {"url": "/", "keyword": f"{domain.split('.')[0]} official", "traffic": int(base_traffic * 0.35), "position": 1, "volume": 12000},
            {"url": "/blog", "keyword": f"{domain.split('.')[0]} blog", "traffic": int(base_traffic * 0.18), "position": 2, "volume": 5400},
            {"url": "/features", "keyword": f"{domain.split('.')[0]} features", "traffic": int(base_traffic * 0.12), "position": 3, "volume": 3200},
            {"url": "/pricing", "keyword": f"{domain.split('.')[0]} pricing", "traffic": int(base_traffic * 0.10), "position": 1, "volume": 8100},
            {"url": "/about", "keyword": f"about {domain.split('.')[0]}", "traffic": int(base_traffic * 0.05), "position": 4, "volume": 1900},
            {"url": "/contact", "keyword": f"contact {domain.split('.')[0]}", "traffic": int(base_traffic * 0.03), "position": 2, "volume": 720},
        ]
        return {"success": True, "source": "dummy", "data": pages}


#  Google Search Console API (REAL DATA - OAuth)
# =====================================================================
class GSCClient:
    """
    Google Search Console API client.
    Requires OAuth2 credentials.
    """
    SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly']

    @staticmethod
    def get_service(credentials_info: Any):
        """Build the Search Console service from credentials info (dict or JSON str)."""
        from google.oauth2.credentials import Credentials
        from googleapiclient.discovery import build
        import json

        if isinstance(credentials_info, str):
            creds_dict = json.loads(credentials_info)
        else:
            creds_dict = credentials_info

        creds = Credentials.from_authorized_user_info(creds_dict, GSCClient.SCOPES)
        return build('searchconsole', 'v1', credentials=creds)

    @staticmethod
    async def get_performance_data(credentials_info: Any, site_url: str, days: int = 30) -> Dict[str, Any]:
        """Fetch search performance data (clicks, impressions, CTR, position)."""
        from datetime import datetime, timedelta
        
        try:
            service = GSCClient.get_service(credentials_info)
            
            end_date = datetime.now().date() - timedelta(days=3)  # GSC data usually has 2-3 days delay
            start_date = end_date - timedelta(days=days)
            
            request = {
                'startDate': start_date.strftime('%Y-%m-%d'),
                'endDate': end_date.strftime('%Y-%m-%d'),
                'dimensions': ['query', 'page'],
                'rowLimit': 500
            }
            
            # Execute in thread since google-api-python-client is synchronous
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None, 
                lambda: service.searchanalytics().query(siteUrl=site_url, body=request).execute()
            )
            
            rows = response.get('rows', [])
            return {
                "success": True,
                "data": rows,
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "source": "google_search_console"
            }
        except Exception as e:
            logger.error(f"GSC Performance Fetch Error: {e}")
            return {"success": False, "error": str(e)}

    @staticmethod
    async def list_sites(credentials_info: Any) -> Dict[str, Any]:
        """List all sites verified in Search Console for this user."""
        try:
            service = GSCClient.get_service(credentials_info)
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None, 
                lambda: service.sites().list().execute()
            )
            
            sites = response.get('siteEntry', [])
            return {"success": True, "sites": sites}
        except Exception as e:
            logger.error(f"GSC List Sites Error: {e}")
            return {"success": False, "error": str(e)}

# =====================================================================
#  Gemini AI Client (FREE tier)
# =====================================================================
class GeminiClient:
    """
    Google Gemini AI — free tier available.
    Used for: content optimization, SEO suggestions, AI writing.
    """

    _model = None

    @staticmethod
    def _get_model():
        if GeminiClient._model is None and settings.has_gemini:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            GeminiClient._model = genai.GenerativeModel("gemini-flash-latest")
        return GeminiClient._model

    @staticmethod
    async def generate(prompt: str, max_tokens: int = 2000) -> Dict[str, Any]:
        """Generate content using Gemini."""
        model = GeminiClient._get_model()
        if model is None:
            return {"success": False, "error": "Gemini API key not configured", "text": ""}

        try:
            response = await model.generate_content_async(
                prompt,
                generation_config={"max_output_tokens": max_tokens, "temperature": 0.7},
            )
            return {"success": True, "text": response.text}
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            return {"success": False, "error": str(e), "text": ""}

    @staticmethod
    async def analyze_seo_content(text: str, target_keyword: str) -> Dict[str, Any]:
        """Use Gemini to analyze content for SEO quality."""
        prompt = f"""You are an expert SEO analyst. Analyze the following content for SEO optimization targeting the keyword "{target_keyword}".

Content:
{text[:3000]}

Provide your analysis as JSON with these fields:
- overall_score (0-100)
- readability_score (0-100)
- keyword_optimization_score (0-100)
- content_depth_score (0-100)
- suggestions (list of specific improvement suggestions)
- missing_topics (list of subtopics that should be covered)
- title_suggestions (list of 3 SEO-optimized title options)
- meta_description_suggestion (one optimized meta description)

Return ONLY valid JSON, no markdown formatting."""

        result = await GeminiClient.generate(prompt, max_tokens=1500)
        if result["success"]:
            try:
                import json
                # Try to parse the JSON from Gemini response
                text = result["text"].strip()
                if text.startswith("```"):
                    text = text.split("```")[1]
                    if text.startswith("json"):
                        text = text[4:]
                return {"success": True, "analysis": json.loads(text)}
            except Exception:
                return {"success": True, "analysis": {"raw_text": result["text"]}}
        return result
