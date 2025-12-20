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

