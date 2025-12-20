# FILE: backend/app/schemas/settings.py
# ============================================================================

from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class UserSettingsResponse(BaseModel):
    id: int
    username: str
    email: str
    display_name: Optional[str]
    profile_image: Optional[str]
    preferences: List[str]
    telegram_chat_id: Optional[str]
    alert_speed: str
    keywords: List[str]
    in_app_notifications: bool
    member_since: datetime
    
    class Config:
        from_attributes = True


class UserSettingsUpdate(BaseModel):
    display_name: Optional[str] = None
    profile_image: Optional[str] = None


class ContactChannelsUpdate(BaseModel):
    email: Optional[EmailStr] = None
    telegram_username: Optional[str] = None
    in_app_notifications: Optional[bool] = None


class AlertSettingsUpdate(BaseModel):
    alert_speed: Optional[str] = None  # 'instant', '30min', 'hourly'
    keywords: Optional[List[str]] = None
