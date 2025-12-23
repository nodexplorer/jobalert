# backend/app/models/job.py

from typing import Optional, Dict, Any
from sqlalchemy import Integer, String, DateTime, JSON, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from datetime import datetime
from app.core.database import Base

class Job(Base):
    __tablename__ = "jobs"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tweet_id: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    tweet_url: Mapped[str] = mapped_column(String, nullable=False)
    author: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    username: Mapped[Optional[str]] = mapped_column(String, index=True, nullable=True)
    text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String, index=True, nullable=True)
    posted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    engagement: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    content_fingerprint: Mapped[Optional[str]] = mapped_column(String, index=True, nullable=True)
    is_duplicate: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    original_job_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey('jobs.id'), nullable=True)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=True)
    
    # Relationship to original job
    original_job = relationship("Job", remote_side=[id], backref="duplicates")
