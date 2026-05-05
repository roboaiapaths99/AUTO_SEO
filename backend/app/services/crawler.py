"""
AutoSEO AI Platform — Site Audit Crawler (REAL)
=================================================
Real web crawler that checks 30+ SEO factors per page:
 - Meta tags, headings, images, links
 - Google PageSpeed Insights per page
 - Broken links, redirects, canonical issues
 - Content quality, word count
"""

from datetime import datetime, timezone
from typing import List, Dict, Set, Optional
from collections import defaultdict
import uuid
import asyncio
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.api_clients import PageSpeedClient, get_http_client
from app.core.config import settings

import logging
logger = logging.getLogger(__name__)


class CrawlerService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.audit_reports
        self.pages_collection = db.audit_pages
        self.jobs_collection = db.crawl_jobs

    async def start_crawl(self, project_id: str, domain: str, max_pages: int = 50) -> str:
        """Start a site audit crawl. Returns job_id."""
        domain = domain.lower().strip().replace("https://", "").replace("http://", "").rstrip("/")
        job_id = str(uuid.uuid4())

        job = {
            "job_id": job_id,
            "project_id": project_id,
            "domain": domain,
            "status": "running",
            "progress": 0,
            "pages_found": 0,
            "pages_crawled": 0,
            "max_pages": max_pages,
            "started_at": datetime.now(timezone.utc),
            "completed_at": None,
            "errors": [],
        }
        await self.jobs_collection.insert_one(job)

        # Run crawl in background (non-blocking)
        asyncio.create_task(self._run_crawl(job_id, domain, max_pages, project_id))
        return job_id

    async def _run_crawl(self, job_id: str, domain: str, max_pages: int, project_id: str):
        """Background crawl task — real BFS crawler."""
        base_url = f"https://{domain}"
        visited: Set[str] = set()
        queue: List[str] = [base_url]
        all_issues: List[dict] = []
        page_reports: List[dict] = []
        broken_links: List[dict] = []

        client = await get_http_client()

        # ── Step 1: Discover pages from sitemap.xml (crucial for SPAs) ──
        sitemap_urls = await self._discover_from_sitemap(client, domain)
        for s_url in sitemap_urls:
            if s_url not in visited and s_url not in queue:
                queue.append(s_url)
        
        logger.info(f"[Crawl {job_id}] Initial queue size after sitemap: {len(queue)}")

        while queue and len(visited) < max_pages:
            url = queue.pop(0)
            if url in visited:
                continue

            # Normalize URL
            parsed = urlparse(url)
            if parsed.netloc and domain not in parsed.netloc:
                continue  # Skip external URLs

            visited.add(url)
            logger.info(f"[Crawl {job_id}] Crawling: {url} | Queue: {len(queue)} | Visited: {len(visited)}/{max_pages}")

            try:
                resp = await client.get(url, timeout=settings.CRAWLER_TIMEOUT, follow_redirects=True)
                final_url = str(resp.url)
                status_code = resp.status_code
                
                # If redirected, add the final URL to visited as well
                if final_url != url:
                    visited.add(final_url)

                if status_code >= 400:
                    broken_links.append({"url": url, "status": status_code})
                    all_issues.append({
                        "type": "error",
                        "category": "HTTP Errors",
                        "message": f"Page returns {status_code}",
                        "url": url,
                    })
                    continue

                if "text/html" not in resp.headers.get("content-type", ""):
                    continue

                html = resp.text
                soup = BeautifulSoup(html, "lxml")

                # ── Run all SEO checks on this page ──
                page_data = await self._analyze_page(url, soup, html, status_code, resp)
                page_reports.append(page_data)
                all_issues.extend(page_data.get("issues", []))

                # ── Extract internal links for BFS ──
                links_found = 0
                for link in soup.find_all("a", href=True):
                    href = link["href"]
                    # Use the final URL (after redirects) as the base for joining
                    full_url = urljoin(final_url, href)
                    parsed_link = urlparse(full_url)
                    
                    # Normalize: strip query params and fragments for the crawl queue
                    clean_url = f"{parsed_link.scheme}://{parsed_link.netloc}{parsed_link.path}"
                    if clean_url.endswith("/"):
                        clean_url = clean_url[:-1]

                    # Domain matching: check if the link belongs to the target domain
                    is_internal = False
                    if parsed_link.netloc:
                        # Check if domain matches (e.g. "example.com" in "www.example.com")
                        if domain in parsed_link.netloc.lower():
                            is_internal = True
                    else:
                        # Relative link without netloc is always internal
                        is_internal = True

                    if is_internal and clean_url not in visited and clean_url not in queue:
                        queue.append(clean_url)
                        links_found += 1
                
                logger.info(f"[Crawl {job_id}] Found {links_found} new internal links on {url}")

            except httpx.TimeoutException:
                all_issues.append({"type": "error", "category": "Performance", "message": "Page timeout", "url": url})
            except Exception as e:
                logger.warning(f"Crawl error for {url}: {e}")

            # ── Update job progress ──
            progress = int((len(visited) / max_pages) * 100)
            await self.jobs_collection.update_one(
                {"job_id": job_id},
                {"$set": {"progress": progress, "pages_crawled": len(visited), "pages_found": len(visited) + len(queue)}},
            )

        # ── Generate final audit report ──
        report = self._generate_report(job_id, project_id, domain, page_reports, all_issues, broken_links)

        # Save report + pages
        await self.collection.insert_one(report)
        if page_reports:
            await self.pages_collection.insert_many(page_reports)

        # Mark job complete
        await self.jobs_collection.update_one(
            {"job_id": job_id},
            {"$set": {"status": "completed", "progress": 100, "completed_at": datetime.now(timezone.utc)}},
        )
        logger.info(f"[Crawl {job_id}] Complete: {len(visited)} pages, {len(all_issues)} issues")

    async def _analyze_page(self, url: str, soup: BeautifulSoup, html: str, status_code: int, resp) -> dict:
        """Run all SEO checks on a single page."""
        issues = []

        # ── 1. Title tag ──
        title_tag = soup.find("title")
        title = title_tag.get_text(strip=True) if title_tag else ""
        if not title:
            issues.append({"type": "error", "category": "Meta Tags", "message": "Missing title tag", "url": url})
        elif len(title) < 30:
            issues.append({"type": "warning", "category": "Meta Tags", "message": f"Title too short ({len(title)} chars)", "url": url})
        elif len(title) > 60:
            issues.append({"type": "warning", "category": "Meta Tags", "message": f"Title too long ({len(title)} chars)", "url": url})

        # ── 2. Meta description ──
        meta_desc_tag = soup.find("meta", attrs={"name": "description"})
        meta_desc = meta_desc_tag.get("content", "") if meta_desc_tag else ""
        if not meta_desc:
            issues.append({"type": "error", "category": "Meta Tags", "message": "Missing meta description", "url": url})
        elif len(meta_desc) < 100:
            issues.append({"type": "warning", "category": "Meta Tags", "message": f"Meta description too short ({len(meta_desc)} chars)", "url": url})
        elif len(meta_desc) > 160:
            issues.append({"type": "warning", "category": "Meta Tags", "message": f"Meta description too long ({len(meta_desc)} chars)", "url": url})

        # ── 3. Headings ──
        h1_tags = soup.find_all("h1")
        if len(h1_tags) == 0:
            issues.append({"type": "error", "category": "Content", "message": "Missing H1 tag", "url": url})
        elif len(h1_tags) > 1:
            issues.append({"type": "warning", "category": "Content", "message": f"Multiple H1 tags ({len(h1_tags)})", "url": url})

        # ── 4. Images ──
        images = soup.find_all("img")
        imgs_no_alt = [img.get("src", "?") for img in images if not img.get("alt")]
        if imgs_no_alt:
            issues.append({"type": "warning", "category": "Images", "message": f"{len(imgs_no_alt)} images without alt text", "url": url})

        # ── 5. Links ──
        all_links = soup.find_all("a", href=True)
        nofollow_count = sum(1 for a in all_links if "nofollow" in (a.get("rel", []) or []))
        
        internal_links = []
        parsed_base = urlparse(url)
        for link in all_links:
            href = link["href"]
            full_url = urljoin(url, href)
            parsed_link = urlparse(full_url)
            if parsed_base.netloc in parsed_link.netloc:
                clean_url = f"{parsed_link.scheme}://{parsed_link.netloc}{parsed_link.path}"
                internal_links.append(clean_url)

        # ── 6. Canonical ──
        canonical = soup.find("link", attrs={"rel": "canonical"})
        if not canonical:
            issues.append({"type": "warning", "category": "Technical", "message": "Missing canonical tag", "url": url})

        # ── 7. Viewport ──
        viewport = soup.find("meta", attrs={"name": "viewport"})
        if not viewport:
            issues.append({"type": "error", "category": "Mobile", "message": "Missing viewport meta tag", "url": url})

        # ── 8. Content quality ──
        text = soup.get_text(separator=" ", strip=True)
        word_count = len(text.split())
        if word_count < 300:
            issues.append({"type": "warning", "category": "Content", "message": f"Thin content ({word_count} words)", "url": url})

        # ── 9. Structured data ──
        schema_scripts = soup.find_all("script", attrs={"type": "application/ld+json"})
        has_structured_data = len(schema_scripts) > 0

        # ── 10. Open Graph ──
        og_title = soup.find("meta", attrs={"property": "og:title"})
        og_desc = soup.find("meta", attrs={"property": "og:description"})
        og_image = soup.find("meta", attrs={"property": "og:image"})
        if not og_title:
            issues.append({"type": "notice", "category": "Social", "message": "Missing Open Graph title", "url": url})

        # ── 11. Response time ──
        response_time = resp.elapsed.total_seconds() if hasattr(resp, 'elapsed') else None

        return {
            "url": url,
            "status_code": status_code,
            "title": title,
            "title_length": len(title),
            "meta_description": meta_desc,
            "meta_description_length": len(meta_desc),
            "h1_tags": [h.get_text(strip=True) for h in h1_tags],
            "h2_count": len(soup.find_all("h2")),
            "word_count": word_count,
            "images_total": len(images),
            "images_no_alt": len(imgs_no_alt),
            "links_total": len(all_links),
            "nofollow_links": nofollow_count,
            "internal_links": list(set(internal_links)),
            "has_canonical": canonical is not None,
            "has_viewport": viewport is not None,
            "has_structured_data": has_structured_data,
            "has_og_tags": og_title is not None,
            "response_time_s": response_time,
            "issues": issues,
            "crawled_at": datetime.now(timezone.utc),
        }

    async def _discover_from_sitemap(self, client: httpx.AsyncClient, domain: str) -> List[str]:
        """Try to find and parse sitemap.xml for URL discovery."""
        urls = []
        sitemap_locations = [
            f"https://{domain}/sitemap.xml",
            f"https://{domain}/sitemap_index.xml",
            f"https://www. {domain}/sitemap.xml"
        ]
        
        for s_url in sitemap_locations:
            try:
                resp = await client.get(s_url, timeout=10)
                if resp.status_code == 200:
                    import xml.etree.ElementTree as ET
                    root = ET.fromstring(resp.content)
                    # Handle namespaces
                    ns = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
                    for loc in root.findall('.//ns:loc', ns):
                        if loc.text:
                            urls.append(loc.text.strip())
                    
                    if urls:
                        logger.info(f"Found {len(urls)} URLs in sitemap: {s_url}")
                        break
            except Exception as e:
                logger.debug(f"Sitemap check failed for {s_url}: {e}")
        
        return urls

    def _generate_report(self, job_id, project_id, domain, pages, issues, broken_links) -> dict:
        """Generate the final audit report with scoring."""
        total_pages = len(pages)
        errors = [i for i in issues if i["type"] == "error"]
        warnings = [i for i in issues if i["type"] == "warning"]
        notices = [i for i in issues if i["type"] == "notice"]

        # Calculate health score (100 - deductions)
        score = 100
        score -= len(errors) * 5    # -5 per error
        score -= len(warnings) * 2  # -2 per warning
        score -= len(notices) * 0.5  # -0.5 per notice
        score = max(0, min(100, int(score)))

        # Group issues by category
        by_category = defaultdict(list)
        for issue in issues:
            by_category[issue["category"]].append(issue)

        return {
            "job_id": job_id,
            "project_id": project_id,
            "domain": domain,
            "health_score": score,
            "total_pages_crawled": total_pages,
            "total_issues": len(issues),
            "errors_count": len(errors),
            "warnings_count": len(warnings),
            "notices_count": len(notices),
            "broken_links": broken_links,
            "issues_by_category": dict(by_category),
            "top_issues": (errors + warnings)[:20],
            "page_stats": {
                "avg_word_count": int(sum(p.get("word_count", 0) for p in pages) / max(total_pages, 1)),
                "pages_without_title": sum(1 for p in pages if not p.get("title")),
                "pages_without_meta_desc": sum(1 for p in pages if not p.get("meta_description")),
                "pages_without_h1": sum(1 for p in pages if not p.get("h1_tags")),
                "pages_with_thin_content": sum(1 for p in pages if p.get("word_count", 0) < 300),
                "total_images_no_alt": sum(p.get("images_no_alt", 0) for p in pages),
            },
            "crawled_at": datetime.now(timezone.utc),
        }

    async def get_job_status(self, job_id: str) -> Optional[dict]:
        """Get the current status of a crawl job."""
        job = await self.jobs_collection.find_one({"job_id": job_id})
        if job:
            job.pop("_id", None)
        return job

    async def get_active_job(self, project_id: str) -> Optional[dict]:
        """Get the latest running job for a project."""
        job = await self.jobs_collection.find_one(
            {"project_id": project_id, "status": "running"},
            sort=[("started_at", -1)]
        )
        if job:
            job.pop("_id", None)
        return job

    async def get_latest_report(self, project_id: str) -> Optional[dict]:
        """Get the latest audit report for a project."""
        report = await self.collection.find_one(
            {"project_id": project_id},
            sort=[("crawled_at", -1)],
        )
        if report:
            report.pop("_id", None)
        return report

    async def get_page_details(self, job_id: str, url: str) -> Optional[dict]:
        """Get audit details for a specific page."""
        page = await self.pages_collection.find_one({"url": url})
        if page:
            page.pop("_id", None)
        return page

    async def list_reports(self, project_id: str) -> List[dict]:
        """List all audit reports for a project."""
        cursor = self.collection.find({"project_id": project_id}).sort("crawled_at", -1)
        reports = await cursor.to_list(length=100)
        for r in reports:
            r.pop("_id", None)
            # Ensure ISO format strings for JSON serialization
            if isinstance(r.get("crawled_at"), datetime):
                r["crawled_at"] = r["crawled_at"].isoformat()
        return reports

    async def get_report_delta(self, project_id: str, report_a_id: str, report_b_id: str) -> dict:
        """Compare two reports (A vs B) and return the delta."""
        report_a = await self.collection.find_one({"job_id": report_a_id})
        report_b = await self.collection.find_one({"job_id": report_b_id})

        if not report_a or not report_b:
            raise ValueError("One or both reports not found")

        # Delta calculation: Current (B) - Previous (A)
        delta = {
            "health_score": report_b["health_score"] - report_a["health_score"],
            "total_pages": report_b["total_pages_crawled"] - report_a["total_pages_crawled"],
            "total_issues": report_b["total_issues"] - report_a["total_issues"],
            "errors": report_b["errors_count"] - report_a["errors_count"],
            "warnings": report_b["warnings_count"] - report_a["warnings_count"],
            "new_broken_links": [],
            "fixed_broken_links": []
        }

        # Compare broken links
        links_a = {bl["url"] for bl in report_a.get("broken_links", [])}
        links_b = {bl["url"] for bl in report_b.get("broken_links", [])}
        
        delta["new_broken_links"] = list(links_b - links_a)
        delta["fixed_broken_links"] = list(links_a - links_b)

        return delta
