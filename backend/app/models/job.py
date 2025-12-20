# backend/app/models/job.py

from sqlalchemy import Column, Integer, String, DateTime, JSON, Text
from sqlalchemy.sql import func
from app.core.database import Base

class Job(Base):
    __tablename__ = "jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    tweet_id = Column(String, unique=True, index=True, nullable=False)
    tweet_url = Column(String, nullable=False)
    author = Column(String)
    username = Column(String, index=True)
    text = Column(Text)
    category = Column(String, index=True)  # video_editing, web_development, etc.
    posted_at = Column(DateTime(timezone=True))
    engagement = Column(JSON, default=dict)  # likes, retweets, replies
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    job_id = Column(Integer, index=True)
    notification_type = Column(String)  # email, telegram
    sent_at = Column(DateTime(timezone=True), server_default=func.now())