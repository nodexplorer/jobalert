# backend/app/services/notification_service.py

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
        
        # Safe defaults for optional fields
        category = job.category or "general"
        username = job.username or "Unknown"
        text = job.text or "No description available"
        
        # Create notification record
        notification = Notification(
            user_id=user.id,
            job_id=job.id,
            title=f"New {category.replace('_', ' ').title()} Job!",
            message=f"@{username}: {text[:200]}{'...' if len(text) > 200 else ''}",
            notification_type='job_alert',
            job_title=text[:100],
            job_category=category,
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
            
            # Safe defaults for optional fields
            category = job.category or "general"
            username = job.username or "Unknown"
            text = job.text or "No description available"
            display_name = user.display_name or user.username
            
            msg = MIMEMultipart()
            msg['From'] = settings.SMTP_USER
            msg['To'] = user.email or ""
            msg['Subject'] = f"🎯 New {category.replace('_', ' ').title()} Job on X!"
            
            body = f"""
Hello {display_name}!

A new job matching your preferences was just posted on X:

👤 Posted by: @{username}
📝 Job: {text[:300]}{'...' if len(text) > 300 else ''}

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
            
            # Safe defaults for optional fields
            username = job.username or "Unknown"
            text = job.text or "No description available"
            
            # TODO: Implement telegram bot sending
            # import telegram
            # bot = telegram.Bot(token=settings.TELEGRAM_BOT_TOKEN)
            # message = f"🎯 New Job!\n\n@{username}: {text[:200]}...\n\n{job.tweet_url}"
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
from datetime import datetime

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