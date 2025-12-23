# backend/app/models/notification.py

from typing import Optional
from sqlalchemy import Integer, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime
from app.core.database import Base

class Notification(Base):
    __tablename__ = "notifications"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey('users.id'), index=True)
    job_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey('jobs.id'), nullable=True)
    
    # Notification content
    title: Mapped[str] = mapped_column(String, nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    notification_type: Mapped[str] = mapped_column(String, default='job_alert')
    
    # Job details (denormalized for faster queries)
    job_title: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    job_category: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    job_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # Status
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    is_clicked: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Delivery channels
    sent_via_email: Mapped[bool] = mapped_column(Boolean, default=False)
    sent_via_telegram: Mapped[bool] = mapped_column(Boolean, default=False)
    sent_via_push: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Timestamps
    sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    clicked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="notifications")