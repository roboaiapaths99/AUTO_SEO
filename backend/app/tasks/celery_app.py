"""
AutoSEO AI Platform — Celery Configuration
============================================
Defines the Celery app, broker, and backend.
"""

from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "autoseo_tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.crawler", "app.tasks.rank_tracker"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
)

# Optional: Periodic tasks (Celery Beat)
celery_app.conf.beat_schedule = {
    "daily-rank-tracking": {
        "task": "app.tasks.rank_tracker.track_all_rankings",
        "schedule": 86400.0, # Every 24 hours
    },
}
