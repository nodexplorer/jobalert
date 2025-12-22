# FILE: backend/app/services/notifications.py
# ============================================================================

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from telegram import Bot
from app.config import settings
import asyncio

class NotificationService:
    """Handle email and Telegram notifications"""
    
    @staticmethod
    def send_email(to_email: str, subject: str, body: str) -> bool:
        """Send email via Gmail SMTP"""
        try:
            msg = MIMEMultipart()
            msg['From'] = settings.SMTP_USER
            msg['To'] = to_email
            msg['Subject'] = subject
            
            msg.attach(MIMEText(body, 'plain'))
            
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
            
            print(f"✅ Email sent to {to_email}")
            return True
        
        except Exception as e:
            print(f"❌ Email error: {e}")
            return False
    
    @staticmethod
    async def send_telegram(chat_id: str, message: str) -> bool:
        """Send Telegram message"""
        if not settings.TELEGRAM_BOT_TOKEN:
            return False
        
        try:
            bot = Bot(token=settings.TELEGRAM_BOT_TOKEN)
            await bot.send_message(chat_id=chat_id, text=message)
            print(f"✅ Telegram sent to {chat_id}")
            return True
        
        except Exception as e:
            print(f"❌ Telegram error: {e}")
            return False

    @staticmethod
    async def send_test_notification(user) -> bool:
        """Send a test notification to check configuration"""
        email_sent = NotificationService.send_email(
            to_email=user.email,
            subject="🔔 Test Notification from Job Alerts",
            body=f"Hello {user.email},\n\nThis is a test notification to verify your settings are working correctly.\n\nBest,\nJob Alerts Team"
        )
        
        telegram_sent = False
        if user.telegram_chat_id:
            telegram_sent = await NotificationService.send_telegram(
                chat_id=user.telegram_chat_id,
                message="🔔 Test Notification from Job Alerts\n\nYour Telegram alerts are working!"
            )
            
        return email_sent or telegram_sent

