# backend/app/schemas/job.py

from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime

class JobResponse(BaseModel):
    id: int
    tweet_id: str
    tweet_url: str
    author: str
    username: str
    text: str
    category: str
    posted_at: Optional[datetime]
    engagement: Dict
    created_at: datetime
    
    class Config:
        from_attributes = True