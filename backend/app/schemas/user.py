# backend/app/schemas/user.py

from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    preferences: List[str]

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOnboarding(BaseModel):
    telegram_id: Optional[str] = None
    preferences: List[str]
    alert_frequency: str = "instant"
    in_app_notifications: bool = True

class UserResponse(BaseModel):
    id: int
    email: str
    preferences: List[str]
    telegram_chat_id: Optional[str]
    alert_frequency: str
    in_app_notifications: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
