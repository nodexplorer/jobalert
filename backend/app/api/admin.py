# backend/app/api/admin.py
"""
Admin Management API - User & System Management
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, and_, or_, desc, func
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel, EmailStr

from app.core.database import get_db
from app.models.user import User
from app.models.job import Job
from app.models.notification import Notification
from app.core.security import require_admin, get_password_hash


router = APIRouter(prefix="/admin", tags=["admin"])


# ============================================================================
# SCHEMAS
# ============================================================================

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    is_admin: Optional[bool] = None
    notification_frequency: Optional[str] = None
    preferences: Optional[List[str]] = None


class BulkActionRequest(BaseModel):
    user_ids: List[int]
    action: str  # 'activate', 'deactivate', 'delete', 'verify'


class SystemSettings(BaseModel):
    scraping_enabled: bool
    scraping_interval_minutes: int
    max_jobs_per_scrape: int
    notification_rate_limit: int
    maintenance_mode: bool


# ============================================================================
# USER MANAGEMENT
# ============================================================================

@router.get("/overview")
async def get_admin_overview(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Get admin dashboard overview statistics
    """
    # User stats
    total_users = (await db.execute(select(func.count(User.id)))).scalar()
    
    # Active users (logged in last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    active_users = (await db.execute(select(func.count(User.id)).where(User.last_login >= thirty_days_ago))).scalar()
    active_percentage = round((active_users / total_users * 100) if total_users > 0 else 0, 1)
    
    # New users this week
    one_week_ago = datetime.utcnow() - timedelta(days=7)
    new_users_week = (await db.execute(select(func.count(User.id)).where(User.created_at >= one_week_ago))).scalar()

    # Job stats
    total_jobs = (await db.execute(select(func.count(Job.id)))).scalar()
    
    # Jobs today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    jobs_today = (await db.execute(select(func.count(Job.id)).where(Job.created_at >= today_start))).scalar()
    
    # Duplicate stats
    duplicate_jobs = (await db.execute(select(func.count(Job.id)).where(Job.is_duplicate == True))).scalar()
    
    # Notification stats
    total_notifications = (await db.execute(select(func.count(Notification.id)))).scalar()
    notifications_today = (await db.execute(select(func.count(Notification.id)).where(Notification.created_at >= today_start))).scalar()
    
    avg_notifications = round((total_notifications / total_users) if total_users > 0 else 0, 1)

    return {
        "users": {
            "total": total_users,
            "active_percentage": active_percentage,
            "new_this_week": new_users_week
        },
        "jobs": {
            "total": total_jobs,
            "today": jobs_today,
            "duplicate_rate": duplicate_jobs
        },
        "notifications": {
            "total": total_notifications,
            "today": notifications_today,
            "avg_per_user": avg_notifications
        }
    }

@router.get("/users")
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,  # 'active', 'inactive', 'verified', 'unverified'
    sort_by: str = Query("created_at", regex="^(created_at|last_login|email)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    List all users with filtering and pagination
    """
    
    # Build query
    query = select(User)
    
    # Apply filters
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                User.email.ilike(search_term),
                User.twitter_username.ilike(search_term),
                User.twitter_name.ilike(search_term)
            )
        )
    
    if status == 'active':
        query = query.where(User.is_active == True)
    elif status == 'inactive':
        query = query.where(User.is_active == False)
    elif status == 'verified':
        query = query.where(User.is_verified == True)
    elif status == 'unverified':
        query = query.where(User.is_verified == False)
    
    # Apply sorting
    sort_column = getattr(User, sort_by)
    if sort_order == 'desc':
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(sort_column)
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar()
    
    # Apply pagination
    query = query.offset(skip).limit(limit)
    
    # Execute query
    result = await db.execute(query)
    users = result.scalars().all()
    
    # Format response
    users_data = []
    for user in users:
        users_data.append({
            "id": user.id,
            "email": user.email,
            "twitter_username": user.twitter_username,
            "twitter_name": user.twitter_name,
            "twitter_avatar": user.twitter_avatar,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "is_admin": user.is_admin,
            "preferences": user.preferences,
            "notification_frequency": user.notification_frequency,
            "created_at": user.created_at,
            "last_login": user.last_login,
            "onboarding_completed": user.onboarding_completed
        })
    
    return {
        "users": users_data,
        "total": total,
        "page": skip // limit + 1,
        "pages": (total + limit - 1) // limit
    }


@router.get("/users/{user_id}")
async def get_user_details(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed information about a specific user
    """
    
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's notification stats
    notification_count = (await db.execute(
        select(func.count(Notification.id)).where(
            Notification.user_id == user_id
        )
    )).scalar()
    
    # Get user's matched jobs count
    jobs_count = (await db.execute(
        select(func.count(Job.id)).where(
            Job.category.in_(user.preferences)
        )
    )).scalar()
    
    # Get recent notifications
    recent_notifications = (await db.execute(
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(desc(Notification.created_at))
        .limit(10)
    )).scalars().all()
    
    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "twitter_id": user.twitter_id,
            "twitter_username": user.twitter_username,
            "twitter_name": user.twitter_name,
            "twitter_avatar": user.twitter_avatar,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "is_admin": user.is_admin,
            "preferences": user.preferences,
            "notification_frequency": user.notification_frequency,
            "telegram_id": user.telegram_id,
            "created_at": user.created_at,
            "last_login": user.last_login,
            "onboarding_completed": user.onboarding_completed
        },
        "stats": {
            "total_notifications": notification_count,
            "total_jobs_matched": jobs_count,
            "days_active": (datetime.utcnow() - user.created_at).days
        },
        "recent_activity": [
            {
                "id": n.id,
                "type": n.notification_type,
                "created_at": n.created_at,
                "status": n.status
            }
            for n in recent_notifications
        ]
    }


@router.patch("/users/{user_id}")
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Update user details
    """
    
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update fields
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    await db.commit()
    await db.refresh(user)
    
    return {
        "message": "User updated successfully",
        "user": {
            "id": user.id,
            "email": user.email,
            "is_active": user.is_active,
            "is_verified": user.is_verified
        }
    }


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a user (soft delete - mark as inactive)
    """
    
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Soft delete
    user.is_active = False
    user.deleted_at = datetime.utcnow()
    
    await db.commit()
    
    return {"message": "User deleted successfully"}


@router.post("/users/bulk-action")
async def bulk_user_action(
    action_request: BulkActionRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Perform bulk actions on multiple users
    """
    
    user_ids = action_request.user_ids
    action = action_request.action
    
    if not user_ids:
        raise HTTPException(status_code=400, detail="No users selected")
    
    # Prevent admin from affecting themselves
    if current_user.id in user_ids and action == 'delete':
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    # Perform action
    if action == 'activate':
        await db.execute(
            update(User)
            .where(User.id.in_(user_ids))
            .values(is_active=True)
        )
    elif action == 'deactivate':
        await db.execute(
            update(User)
            .where(User.id.in_(user_ids))
            .values(is_active=False)
        )
    elif action == 'verify':
        await db.execute(
            update(User)
            .where(User.id.in_(user_ids))
            .values(is_verified=True)
        )
    elif action == 'delete':
        await db.execute(
            update(User)
            .where(User.id.in_(user_ids))
            .values(is_active=False, deleted_at=datetime.utcnow())
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    await db.commit()
    
    return {
        "message": f"Action '{action}' performed on {len(user_ids)} users",
        "affected_users": len(user_ids)
    }


# ============================================================================
# JOB MANAGEMENT
# ============================================================================

@router.get("/jobs")
async def list_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    category: Optional[str] = None,
    is_duplicate: Optional[bool] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    List all jobs with filtering
    """
    
    query = select(Job)
    
    # Apply filters
    if category:
        query = query.where(Job.category == category)
    
    if is_duplicate is not None:
        query = query.where(Job.is_duplicate == is_duplicate)
    
    if date_from:
        query = query.where(Job.created_at >= date_from)
    
    if date_to:
        query = query.where(Job.created_at <= date_to)
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar()
    
    # Order by newest first
    query = query.order_by(desc(Job.created_at)).offset(skip).limit(limit)
    
    result = await db.execute(query)
    jobs = result.scalars().all()
    
    return {
        "jobs": [
            {
                "id": job.id,
                "title": job.title,
                "description": job.description[:200] + "..." if len(job.description) > 200 else job.description,
                "category": job.category,
                "budget": job.budget,
                "url": job.url,
                "is_duplicate": job.is_duplicate,
                "created_at": job.created_at
            }
            for job in jobs
        ],
        "total": total,
        "page": skip // limit + 1,
        "pages": (total + limit - 1) // limit
    }


@router.delete("/jobs/{job_id}")
async def delete_job(
    job_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a job (remove spam/inappropriate content)
    """
    
    result = await db.execute(
        select(Job).where(Job.id == job_id)
    )
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    await db.delete(job)
    await db.commit()
    
    return {"message": "Job deleted successfully"}


@router.post("/jobs/cleanup-duplicates")
async def cleanup_duplicates(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Clean up old duplicate jobs
    """
    
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    result = await db.execute(
        delete(Job).where(
            and_(
                Job.is_duplicate == True,
                Job.created_at < cutoff_date
            )
        )
    )
    
    await db.commit()
    
    return {
        "message": f"Cleaned up duplicates older than {days} days",
        "deleted_count": result.rowcount
    }


# ============================================================================
# SYSTEM SETTINGS
# ============================================================================

@router.get("/settings")
async def get_system_settings(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current system settings
    """
    
    # In production, store these in a settings table
    # For now, return defaults
    return {
        "scraping_enabled": True,
        "scraping_interval_minutes": 5,
        "max_jobs_per_scrape": 100,
        "notification_rate_limit": 50,
        "maintenance_mode": False
    }


@router.put("/settings")
async def update_system_settings(
    settings: SystemSettings,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Update system settings
    """
    
    # In production, save to database
    # For now, just validate and return
    
    return {
        "message": "Settings updated successfully",
        "settings": settings.dict()
    }


# ============================================================================
# SYSTEM ACTIONS
# ============================================================================

@router.post("/system/trigger-scrape")
async def trigger_manual_scrape(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Manually trigger a scraping job
    """
    
    # In production, this would trigger a Celery task
    # For now, return placeholder
    
    from app.tasks.scraping_tasks import scrape_all_categories
    
    # Trigger async task
    task = scrape_all_categories.delay()
    
    return {
        "message": "Scraping job triggered",
        "task_id": task.id
    }


@router.post("/system/send-test-notification")
async def send_test_notification(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Send a test notification to a user
    """
    
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Send test notification
    from app.services.notifications import NotificationService
    
    notification_service = NotificationService()
    await notification_service.send_test_notification(user)
    
    return {"message": "Test notification sent"}