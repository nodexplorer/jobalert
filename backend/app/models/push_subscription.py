# FILE: backend/app/models/push_subscription.py

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.sql import func
from app.core.database import Base

class PushSubscription(Base):
    __tablename__ = "push_subscriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), index=True)
    
    # Push subscription data
    endpoint = Column(String, unique=True, nullable=False)
    p256dh_key = Column(String, nullable=False)
    auth_key = Column(String, nullable=False)
    
    # Metadata
    user_agent = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    last_used = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())