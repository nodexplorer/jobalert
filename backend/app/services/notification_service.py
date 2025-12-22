# FILE: backend/app/services/notification_service.py

from sqlalchemy.orm import Session
from app.models.user import User
from app.models.job import Job
from app.models.notification import Notification
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings

class NotificationService:
    """Handle sending notifications via email, telegram, push"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def send_job_notification(self, user: User, job: Job):
        """Send notification about new job to user"""
        
        # Create notification record
        notification = Notification(
            user_id=user.id,
            job_id=job.id,
            title=f"New {job.category.replace('_', ' ').title()} Job!",
            message=f"@{job.username}: {job.text[:200]}...",
            notification_type='job_alert',
            job_title=job.text[:100],
            job_category=job.category,
            job_url=job.tweet_url,
            is_read=False,
            is_clicked=False
        )
        
        # Send via email
        if user.email and user.email != f"{user.username}@twitter.placeholder":
            sent_email = self._send_email(user, job)
            notification.sent_via_email = sent_email
        
        # Send via telegram
        if user.telegram_chat_id:
            sent_telegram = self._send_telegram(user, job)
            notification.sent_via_telegram = sent_telegram
        
        # Save notification
        self.db.add(notification)
        self.db.commit()
        
        print(f"    ✉️ Notified {user.username}")
    
    def _send_email(self, user: User, job: Job) -> bool:
        """Send email notification"""
        try:
            if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
                return False
            
            msg = MIMEMultipart()
            msg['From'] = settings.SMTP_USER
            msg['To'] = user.email
            msg['Subject'] = f"🎯 New {job.category.replace('_', ' ').title()} Job on X!"
            
            body = f"""
Hello {user.display_name or user.username}!

A new job matching your preferences was just posted on X:

👤 Posted by: @{job.username}
📝 Job: {job.text[:300]}{'...' if len(job.text) > 300 else ''}

🔗 Apply now: {job.tweet_url}

⚡ This alert was sent within minutes of the job being posted. Be quick to apply!

---
X Job Bot - Never miss an opportunity
Manage your alerts: {settings.FRONTEND_URL}/settings
            """
            
            msg.attach(MIMEText(body, 'plain'))
            
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
            
            return True
            
        except Exception as e:
            print(f"    ❌ Email error: {e}")
            return False
    
    def _send_telegram(self, user: User, job: Job) -> bool:
        """Send telegram notification"""
        try:
            if not settings.TELEGRAM_BOT_TOKEN:
                return False
            
            # TODO: Implement telegram bot sending
            # import telegram
            # bot = telegram.Bot(token=settings.TELEGRAM_BOT_TOKEN)
            # message = f"🎯 New Job!\n\n@{job.username}: {job.text[:200]}...\n\n{job.tweet_url}"
            # bot.send_message(chat_id=user.telegram_chat_id, text=message)
            
            return True
            
        except Exception as e:
            print(f"    ❌ Telegram error: {e}")
            return False


# ============================================================================
# FILE: backend/app/tasks/scraping_tasks.py (Celery)
# ============================================================================

from app.core.celery_app import celery_app
from app.core.database import SessionLocal
from app.services.job_scraping_service import JobScrapingService

@celery_app.task
def scrape_twitter_jobs():
    """
    Celery task to scrape Twitter for jobs
    Runs every 5 minutes via Celery Beat
    """
    db = SessionLocal()
    
    try:
        service = JobScrapingService(db)
        new_jobs = service.scrape_all_categories()
        
        return {
            "success": True,
            "new_jobs": new_jobs,
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        print(f"❌ Scraping task error: {e}")
        return {
            "success": False,
            "error": str(e)
        }
    
    finally:
        db.close()
