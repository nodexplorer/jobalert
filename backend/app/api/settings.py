# backend/api/settings.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.settings import (
    UserSettingsUpdate,
    UserSettingsResponse,
    ContactChannelsUpdate,
    AlertSettingsUpdate
)

router = APIRouter()


@router.get("/settings/profile", response_model=UserSettingsResponse)
def get_user_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's settings"""
    return UserSettingsResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        display_name=current_user.display_name,
        profile_image=current_user.profile_image,
        preferences=current_user.preferences,
        telegram_chat_id=current_user.telegram_chat_id,
        alert_speed=current_user.alert_speed,
        keywords=current_user.keywords,
        in_app_notifications=current_user.in_app_notifications,
        member_since=current_user.created_at
    )


@router.put("/settings/profile")
def update_profile(
    settings: UserSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile settings"""
    
    # Update basic profile
    if settings.display_name is not None:
        current_user.display_name = settings.display_name
    
    if settings.profile_image is not None:
        current_user.profile_image = settings.profile_image
    
    db.commit()
    db.refresh(current_user)
    
    return {"message": "Profile updated successfully", "user": current_user}


@router.put("/settings/contact-channels")
def update_contact_channels(
    channels: ContactChannelsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update email and telegram settings"""
    
    # Update email (with verification check)
    if channels.email is not None:
        # Check if email is already taken
        existing = db.query(User).filter(
            User.email == channels.email,
            User.id != current_user.id
        ).first()
        
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        
        current_user.email = channels.email
        # TODO: Send verification email
    
    # Update telegram
    if channels.telegram_username is not None:
        current_user.telegram_chat_id = channels.telegram_username
        # TODO: Send Telegram verification message
    
    # Update in-app notifications
    if channels.in_app_notifications is not None:
        current_user.in_app_notifications = channels.in_app_notifications
    
    db.commit()
    db.refresh(current_user)
    
    return {"message": "Contact channels updated successfully"}


@router.put("/settings/alerts")
def update_alert_settings(
    settings: AlertSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update alert speed and keywords"""
    
    # Update alert speed
    if settings.alert_speed is not None:
        if settings.alert_speed not in ['instant', '30min', 'hourly']:
            raise HTTPException(status_code=400, detail="Invalid alert speed")
        current_user.alert_speed = settings.alert_speed
    
    # Update keywords
    if settings.keywords is not None:
        # Validate keywords (max 20, each max 50 chars)
        if len(settings.keywords) > 20:
            raise HTTPException(status_code=400, detail="Maximum 20 keywords allowed")
        
        for keyword in settings.keywords:
            if len(keyword) > 50:
                raise HTTPException(status_code=400, detail="Keywords must be under 50 characters")
        
        current_user.keywords = settings.keywords
    
    db.commit()
    db.refresh(current_user)
    
    return {"message": "Alert settings updated successfully"}


@router.put("/settings/preferences")
def update_job_preferences(
    preferences: List[str],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update job category preferences"""
    
    valid_categories = [
        'video_editing',
        'web_development',
        'content_writing',
        'graphic_design',
        'motion_graphics'
    ]
    
    # Validate preferences
    for pref in preferences:
        if pref not in valid_categories:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid category: {pref}"
            )
    
    current_user.preferences = preferences
    db.commit()
    db.refresh(current_user)
    
    return {
        "message": "Preferences updated successfully",
        "preferences": current_user.preferences
    }


@router.post("/settings/upload-avatar")
def upload_avatar(
    # file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload profile picture"""
    # TODO: Implement file upload
    # 1. Validate file type (jpg, png)
    # 2. Validate file size (< 5MB)
    # 3. Upload to S3 or similar
    # 4. Update user.profile_image
    
    return {"message": "Avatar upload not yet implemented"}


@router.delete("/settings/disconnect-account")
def disconnect_account(
    provider: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Disconnect social account (Twitter, Google)"""
    
    if provider == "twitter":
        # Don't allow disconnecting Twitter if it's the only login method
        if not current_user.hashed_password:
            raise HTTPException(
                status_code=400,
                detail="Cannot disconnect Twitter without setting a password first"
            )
        
        current_user.twitter_id = None
        db.commit()
        
        return {"message": "Twitter account disconnected"}
    
    elif provider == "google":
        # TODO: Implement Google disconnect
        return {"message": "Google disconnect not yet implemented"}
    
    else:
        raise HTTPException(status_code=400, detail="Invalid provider")


@router.get("/settings/stats")
def get_user_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user statistics for Quick Links"""
    
    # TODO: Calculate real stats from database
    from app.models.notification import Notification
    from sqlalchemy import func
    
    # Count notifications sent
    alerts_count = db.query(func.count(Notification.id)).filter(
        Notification.user_id == current_user.id
    ).scalar()
    
    # Count saved jobs (implement SavedJob model)
    saved_count = 17  # Placeholder
    
    # Count subscribers (if implementing referral system)
    subscribers_count = 15  # Placeholder
    
    return {
        "alerts_today": alerts_count,
        "saved_jobs": saved_count,
        "subscribers": subscribers_count,
        "notification_status": "instant" if current_user.in_app_notifications else "disabled"
    }
