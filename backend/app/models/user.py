# backend/app/models/user.py

from sqlalchemy import Column, Integer, String, DateTime, JSON, Boolean
from sqlalchemy.sql import func
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    twitter_id = Column(String, unique=True, index=True)  # NEW
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True)
    display_name = Column(String)  # NEW - Twitter display name
    profile_image = Column(String)  # NEW - Avatar URL
    hashed_password = Column(String, nullable=True)  # Optional for OAuth users
    preferences = Column(JSON, default=list)
    is_admin = Column(Boolean, default=False) 
    is_active = Column(Boolean, default=True)
    alert_speed = Column(String, default="instant")  # instant, 30mins, hourly
    keywords = Column(JSON, default=list)
    in_app_notifications = Column(Boolean, default=True)
    telegram_chat_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    alert_speed = Column(String, default='instant'),
    keywords = Column(JSON, default=list)
    is_pro = Column(Boolean, default=False)
    last_login = Column(DateTime, nullable=True)
    deleted_at = Column(DateTime, nullable=True)  # ⭐ ADD THIS (soft delete)
    
    # Relationships
    notifications = relationship("Notification", back_populates="user")
