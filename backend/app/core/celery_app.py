# backend/app/core/celery_app.py

from celery import Celery
from backend.app.core.celery_app.schedules import crontab
from app.config import settings

celery_app = Celery(
    "job_bot",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    
    # Beat schedule - runs scraping every 5 minutes
    beat_schedule={
        "scrape-twitter-jobs": {
            "task": "app.tasks.scraping_tasks.scrape_all_categories",
            "schedule": crontab(minute="*/5"),  # Every 5 minutes
        },
    },
)
