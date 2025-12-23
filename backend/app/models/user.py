# backend/app/models/user.py

from typing import Optional, List
from sqlalchemy import Column, Integer, String, DateTime, JSON, Boolean
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from datetime import datetime
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    # Use Mapped for proper type hints with SQLAlchemy 2.0
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    twitter_id: Mapped[Optional[str]] = mapped_column(String, unique=True, index=True, nullable=True)
    username: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String, unique=True, index=True, nullable=True)
    display_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    profile_image: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    hashed_password: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    preferences: Mapped[Optional[List]] = mapped_column(JSON, default=list)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    alert_speed: Mapped[str] = mapped_column(String, default="instant")
    keywords: Mapped[Optional[List]] = mapped_column(JSON, default=list)
    in_app_notifications: Mapped[bool] = mapped_column(Boolean, default=True)
    telegram_chat_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    is_pro: Mapped[bool] = mapped_column(Boolean, default=False)
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    notifications = relationship("Notification", back_populates="user")