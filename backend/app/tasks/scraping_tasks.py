# FILE: backend/app/tasks/scraping_tasks.py
# ============================================================================

from app.core.celery_app import celery_app
from app.services.scraper import TwitterScraper
from app.services.notifications import NotificationService
from app.core.database import SessionLocal
from app.models.job import Job, Notification
from app.models.user import User
from sqlalchemy import and_
import asyncio

SEARCH_QUERIES = {
    'video_editing': [
        'video editor needed',
        'hiring video editor',
        'video editing job'
    ],
    'web_development': [
        'web developer needed',
        'hiring web developer',
        'frontend developer job'
    ],
    'content_writing': [
        'content writer needed',
        'hiring writer',
        'copywriter job'
    ]
}

@celery_app.task
def scrape_all_categories():
    """Scrape all job categories"""
    print("🔍 Starting job scraping...")
    
    scraper = TwitterScraper(headless=True)
    db = SessionLocal()
    notifier = NotificationService()
    
    try:
        for category, queries in SEARCH_QUERIES.items():
            print(f"  Searching: {category}")
            
            all_jobs = []
            for query in queries:
                jobs = scraper.search_jobs(query, category, max_results=10)
                all_jobs.extend(jobs)
            
            # Save new jobs and notify users
            for job_data in all_jobs:
                # Check if job exists
                existing = db.query(Job).filter(Job.tweet_id == job_data['tweet_id']).first()
                if existing:
                    continue
                
                # Save job
                job = Job(**job_data)
                db.add(job)
                db.commit()
                db.refresh(job)
                
                print(f"  ✅ New job saved: {job.tweet_id}")
                
                # Find matching users
                users = db.query(User).filter(
                    User.preferences.contains([category]),
                    User.is_active == True
                ).all()
                
                # Notify each user
                for user in users:
                    # Check if already notified
                    already_notified = db.query(Notification).filter(
                        and_(
                            Notification.user_id == user.id,
                            Notification.job_id == job.id
                        )
                    ).first()
                    
                    if already_notified:
                        continue
                    
                    # Send email
                    email_body = f"""
New {category.replace('_', ' ').title()} Job Found!

Author: @{job.username}
Job: {job.text[:200]}...

Apply here: {job.tweet_url}

---
X Job Bot - Never miss an opportunity!
                    """
                    
                    notifier.send_email(
                        to_email=user.email,
                        subject=f"🎯 New {category.replace('_', ' ').title()} Job!",
                        body=email_body
                    )
                    
                    # Send Telegram if configured
                    if user.telegram_chat_id:
                        telegram_msg = f"🎯 New {category.replace('_', ' ').title()} Job!\n\n@{job.username}: {job.text[:150]}...\n\n{job.tweet_url}"
                        asyncio.run(notifier.send_telegram(user.telegram_chat_id, telegram_msg))
                    
                    # Record notification
                    notification = Notification(
                        user_id=user.id,
                        job_id=job.id,
                        notification_type='email'
                    )
                    db.add(notification)
                
                db.commit()
        
        print("✅ Scraping complete!")
    
    finally:
        scraper.close()
        db.close()