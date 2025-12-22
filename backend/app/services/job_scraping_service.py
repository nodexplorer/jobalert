# FILE: backend/app/services/job_scraping_service.py
# ============================================================================

from typing import List, Dict
from sqlalchemy.orm import Session
from app.models.job import Job
from app.models.user import User
from app.models.notification import Notification
from app.services.twitter_scraper import TwitterScraper
from app.services.notification_service import NotificationService
from datetime import datetime

class JobScrapingService:
    """
    Orchestrates job scraping and notification delivery
    """
    
    # Search queries by category
    SEARCH_QUERIES = {
        'video_editing': [
            'video editor needed',
            'hiring video editor',
            'video editing job remote',
            'looking for video editor',
            'premiere pro editor needed',
        ],
        'web_development': [
            'web developer needed',
            'hiring web developer',
            'react developer job',
            'frontend developer remote',
            'fullstack developer needed',
        ],
        'content_writing': [
            'content writer needed',
            'hiring copywriter',
            'content writing job',
            'looking for writer',
            'blog writer needed',
        ],
        'graphic_design': [
            'graphic designer needed',
            'hiring designer',
            'design job remote',
            'logo designer needed',
        ],
        'motion_graphics': [
            'motion graphics designer',
            'after effects animator',
            'motion designer needed',
        ]
    }
    
    def __init__(self, db: Session):
        self.db = db
        self.scraper = TwitterScraper(headless=True)
        self.notification_service = NotificationService(db)
    
    def scrape_all_categories(self):
        """Main entry point: Scrape all categories and notify users"""
        print("\n" + "="*70)
        print("🤖 STARTING JOB SCRAPING BOT")
        print("="*70 + "\n")
        
        total_new_jobs = 0
        
        for category, queries in self.SEARCH_QUERIES.items():
            print(f"\n📂 Category: {category.upper()}")
            print("-" * 70)
            
            category_jobs = []
            
            # Search with multiple queries
            for query in queries:
                jobs = self.scraper.search_jobs(query, max_results=5)
                category_jobs.extend(jobs)
                time.sleep(2)  # Be polite to Twitter
            
            # Remove duplicates
            unique_jobs = {job['tweet_id']: job for job in category_jobs}
            category_jobs = list(unique_jobs.values())
            
            print(f"✅ Found {len(category_jobs)} unique jobs for {category}")
            
            # Process and save jobs
            new_jobs = self._process_jobs(category_jobs, category)
            total_new_jobs += new_jobs
        
        self.scraper.close()
        
        print("\n" + "="*70)
        print(f"✅ SCRAPING COMPLETE - {total_new_jobs} NEW JOBS ADDED")
        print("="*70 + "\n")
        
        return total_new_jobs
    
    def _process_jobs(self, jobs: List[Dict], category: str) -> int:
        """Process scraped jobs and notify users"""
        new_jobs_count = 0
        
        for job_data in jobs:
            # Check if job already exists
            existing = self.db.query(Job).filter(
                Job.tweet_id == job_data['tweet_id']
            ).first()
            
            if existing:
                continue
            
            # Create new job
            job = Job(
                tweet_id=job_data['tweet_id'],
                tweet_url=job_data['tweet_url'],
                author=job_data['author'],
                username=job_data['username'],
                text=job_data['text'],
                category=category,
                posted_at=job_data['posted_at'],
                engagement=job_data['engagement']
            )
            
            self.db.add(job)
            self.db.commit()
            self.db.refresh(job)
            
            new_jobs_count += 1
            print(f"  💾 Saved job: {job.tweet_id}")
            
            # Find matching users and notify
            self._notify_matching_users(job, category)
        
        return new_jobs_count
    
    def _notify_matching_users(self, job: Job, category: str):
        """Find users interested in this category and notify them"""
        
        # Find users who want this category
        users = self.db.query(User).filter(
            User.preferences.contains([category]),
            User.is_active == True
        ).all()
        
        print(f"  📨 Notifying {len(users)} users")
        
        for user in users:
            # Check if keywords match (if user has keywords)
            if user.keywords:
                text_lower = job.text.lower()
                if not any(keyword.lower() in text_lower for keyword in user.keywords):
                    continue
            
            # Check if user already notified about this job
            existing_notification = self.db.query(Notification).filter(
                Notification.user_id == user.id,
                Notification.job_id == job.id
            ).first()
            
            if existing_notification:
                continue
            
            # Send notification
            self.notification_service.send_job_notification(user, job)