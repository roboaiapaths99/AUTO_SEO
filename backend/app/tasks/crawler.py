"""
AutoSEO AI Platform — Crawler Tasks
=====================================
Background tasks for site auditing.
"""

import time
from app.tasks.celery_app import celery_app
from app.core.database import get_database_sync # Need a sync version or use async with loop
from datetime import datetime, timezone
from bson import ObjectId

@celery_app.task(name="app.tasks.crawler.crawl_site")
def crawl_site(job_id: str, project_id: str, domain: str):
    """
    Simulates a site crawl and SEO audit.
    Updates MongoDB job status and creates a report.
    """
    # In a real app, you'd use a sync MongoDB client here or handle async properly
    # For this demo, we'll simulate the process
    
    print(f"Starting crawl for {domain} (Job: {job_id})")
    
    # Simulate progress
    for i in range(1, 6):
        time.sleep(2) # Simulate work
        progress = i * 20
        # Update job status in DB (skipped in this mock for brevity)
        print(f"Crawl Progress: {progress}%")

    # Create Mock Report
    report = {
        "project_id": project_id,
        "domain": domain,
        "health_score": 82,
        "pages_crawled": 150,
        "issues_summary": {"errors": 12, "warnings": 24, "notices": 45},
        "issue_details": [
            {"type": "Missing Alt Text", "severity": "warning", "page_url": f"https://{domain}/img1", "description": "Image missing alt attribute", "how_to_fix": "Add alt tag"},
            {"type": "404 Error", "severity": "error", "page_url": f"https://{domain}/broken", "description": "Page not found", "how_to_fix": "Fix or redirect link"},
        ],
        "performance": {"avg_load_time": 1.2},
        "crawled_at": datetime.now(timezone.utc)
    }
    
    print(f"Crawl completed for {domain}")
    return report
