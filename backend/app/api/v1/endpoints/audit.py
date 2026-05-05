"""
AutoSEO AI Platform — Crawler Endpoints
=========================================
REST API for managing site audits.
"""

import asyncio
from fastapi import APIRouter, Depends, Body, HTTPException, status, BackgroundTasks
from app.api.deps import get_db, get_current_user, get_ai_service
from app.models.schemas import AuditReport, CrawlJobStatus, User, AuditRoadmap
from app.services.crawler import CrawlerService
from app.services.ai_service import AIVisibilityService
from app.services.cms_service import CMSService

from app.services.link_graph_service import LinkGraphService

router = APIRouter()


async def get_crawler_service(db=Depends(get_db)) -> CrawlerService:
    return CrawlerService(db)


@router.post("/crawl", response_model=dict)
async def start_audit(
    background_tasks: BackgroundTasks,
    project_id: str = Body(..., embed=True),
    domain: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    crawler_service: CrawlerService = Depends(get_crawler_service)
):
    """Start a new site audit crawl in the background."""
    # We use background_tasks to prevent the request from hanging for minutes
    background_tasks.add_task(crawler_service.start_crawl, project_id, domain)
    return {"message": "Crawl initialized in background. Check status using the job endpoint."}


@router.get("/status/{job_id}", response_model=CrawlJobStatus)
async def get_audit_status(
    job_id: str,
    current_user: User = Depends(get_current_user),
    crawler_service: CrawlerService = Depends(get_crawler_service)
):
    """Check the status of an ongoing crawl."""
    status = await crawler_service.get_job_status(job_id)
    if not status:
        raise HTTPException(status_code=404, detail="Job not found")
    return status


@router.get("/active-job/{project_id}")
async def get_active_job(
    project_id: str,
    current_user: User = Depends(get_current_user),
    crawler_service: CrawlerService = Depends(get_crawler_service)
):
    """Get the currently running crawl job for a project, if any."""
    job = await crawler_service.get_active_job(project_id)
    return job


@router.get("/report/{project_id}", response_model=AuditReport)
async def get_audit_report(
    project_id: str,
    current_user: User = Depends(get_current_user),
    crawler_service: CrawlerService = Depends(get_crawler_service)
):
    """Get the latest audit report for a project."""
    report = await crawler_service.get_latest_report(project_id)
    if not report:
        raise HTTPException(status_code=404, detail="No report found for this project")
    return report


@router.get("/roadmap/{project_id}", response_model=AuditRoadmap)
async def get_audit_roadmap(
    project_id: str,
    current_user: User = Depends(get_current_user),
    crawler_service: CrawlerService = Depends(get_crawler_service),
    ai_service: AIVisibilityService = Depends(get_ai_service)
):
    """Generate an AI-powered SEO roadmap based on the latest audit."""
    report = await crawler_service.get_latest_report(project_id)
    if not report:
        raise HTTPException(status_code=404, detail="No audit report found. Please run an audit first.")
    
    roadmap = await ai_service.generate_fix_plan(report)
    return roadmap


@router.get("/graph/{project_id}")
async def get_link_graph(
    project_id: str,
    current_user: User = Depends(get_current_user),
    crawler_service: CrawlerService = Depends(get_crawler_service)
):
    """Get the internal link graph and PageRank authority for the site."""
    report = await crawler_service.get_latest_report(project_id)
    if not report:
        raise HTTPException(status_code=404, detail="No audit report found")
    
    # In a real app, the report dictionary should be converted to a dict if it's a Pydantic model
    report_dict = report.model_dump() if hasattr(report, 'model_dump') else report
    
    # Optimize query: Search by domain in a safer way than naked regex
    domain = report_dict.get('domain', '')
    # Get the last 1000 pages crawled for this domain
    cursor = crawler_service.pages_collection.find({
        "$or": [
            {"url": {"$regex": f"^https?://(www\\.)?{domain}"}},
            {"url": {"$regex": f"^{domain}"}}
        ]
    }).sort("crawled_at", -1).limit(1000)
    
    pages = await cursor.to_list(length=1000)
    
    # Offload heavy PageRank/Graph calculation to a thread to avoid blocking the event loop
    service = LinkGraphService(report_dict, pages)
    graph_data = await asyncio.to_thread(service.get_graph_data)
    
    return graph_data


@router.post("/graph/{project_id}/optimize")
async def optimize_link_flow(
    project_id: str,
    page_url: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    ai_service: AIVisibilityService = Depends(get_ai_service)
):
    """Generate an AI-powered internal link restructuring plan for a specific page."""
    # In a real app, we would fetch the graph data to feed to Gemini
    from app.services.ai_service import GeminiClient
    gemini = GeminiClient()
    
    prompt = f"""
    You are an expert technical SEO architect.
    The user wants to optimize the internal link flow for the page: {page_url}.
    
    Please provide a concise, actionable 3-step internal link restructuring plan to boost the PageRank (link-juice) of this page.
    Format your response in a short paragraph or bullet points. Keep it under 100 words.
    """
    
    plan_data = await gemini.generate(prompt)
    plan = plan_data.get("text", "Focus on adding internal links from high-authority pages to this URL.")
    return {"page_url": page_url, "optimization_plan": plan}


@router.post("/graph/{project_id}/apply-strategy")
async def apply_link_strategy(
    project_id: str,
    data: dict = Body(...),
    db=Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deploy the internal link restructuring plan to the CMS."""
    cms_service = CMSService(db)
    result = await cms_service.deploy_link_restructuring(project_id, data)
    return result


@router.get("/reports/{project_id}")
async def list_reports(
    project_id: str,
    current_user: User = Depends(get_current_user),
    crawler_service: CrawlerService = Depends(get_crawler_service)
):
    """List all historical reports for a project."""
    return await crawler_service.list_reports(project_id)


@router.get("/delta")
async def get_report_delta(
    project_id: str,
    report_a: str,
    report_b: str,
    current_user: User = Depends(get_current_user),
    crawler_service: CrawlerService = Depends(get_crawler_service)
):
    """Compare two audit reports to see progress."""
    try:
        return await crawler_service.get_report_delta(project_id, report_a, report_b)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
