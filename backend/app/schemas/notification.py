# FILE: backend/app/schemas/notification.py
# ============================================================================

from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    job_id: Optional[int]
    title: str
    message: str
    notification_type: str
    job_title: Optional[str]
    job_category: Optional[str]
    job_url: Optional[str]
    is_read: bool
    is_clicked: bool
    sent_via_email: bool
    sent_via_telegram: bool
    sent_via_push: bool
    sent_at: datetime
    read_at: Optional[datetime]
    clicked_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class NotificationStats(BaseModel):
    total: int
    unread: int
    read: int
    clicked: int
    today: int
    this_week: int


class MarkAsReadRequest(BaseModel):
    notification_ids: list[int]
