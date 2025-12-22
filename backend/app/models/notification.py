# backend/app/models/notification.py

from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), index=True)
    job_id = Column(Integer, ForeignKey('jobs.id'), nullable=True)
    
    # Notification content
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String, default='job_alert')  # job_alert, system, promotion
    
    # Job details (denormalized for faster queries)
    job_title = Column(String, nullable=True)
    job_category = Column(String, nullable=True)
    job_url = Column(String, nullable=True)
    
    # Status
    is_read = Column(Boolean, default=False)
    is_clicked = Column(Boolean, default=False)
    
    # Delivery channels
    sent_via_email = Column(Boolean, default=False)
    sent_via_telegram = Column(Boolean, default=False)
    sent_via_push = Column(Boolean, default=False)
    
    # Timestamps
    sent_at = Column(DateTime(timezone=True), server_default=func.now())
    read_at = Column(DateTime(timezone=True), nullable=True)
    clicked_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", backref="notifications")
