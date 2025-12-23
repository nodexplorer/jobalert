# backend/app/api/analytics.py
"""
Analytics API - User & Admin Statistics
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_, or_, desc, Integer, case
from datetime import datetime, timedelta, date
from typing import List, Optional
from enum import Enum

from app.core.database import get_db
from app.models.user import User
from app.models.job import Job
from app.models.notification import Notification
from app.core.security import get_current_user, require_admin


router = APIRouter(prefix="/analytics", tags=["analytics"])


# ============================================================================
# ENUMS
# ============================================================================

class TimeRange(str, Enum):
    TODAY = "today"
    WEEK = "week"
    MONTH = "month"
    YEAR = "year"
    ALL = "all"


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_start_date(time_range: TimeRange) -> datetime:
    """Convert time range enum to start date"""
    now = datetime.utcnow()
    
    if time_range == TimeRange.TODAY:
        return now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif time_range == TimeRange.WEEK:
        return now - timedelta(days=7)
    elif time_range == TimeRange.MONTH:
        return now - timedelta(days=30)
    elif time_range == TimeRange.YEAR:
        return now - timedelta(days=365)
    else:  # ALL
        return datetime.min


def get_daily_job_trend(
    db: Session,
    categories: List[str],
    days: int
) -> List[dict]:
    """Get daily job count trend for specific categories"""
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Check if categories list is empty to avoid SQL errors
    if not categories:
        return []

    # Query for job counts by date
    job_counts = db.query(
        func.date(Job.created_at).label('date'),
        func.count(Job.id).label('count')
    ).filter(
        Job.created_at >= start_date,
        Job.category.in_(categories),
        Job.is_duplicate == False
    ).group_by(func.date(Job.created_at)).all()
    
    # Convert results to dict - handle both string and date objects
    results_dict = {}
    for row in job_counts:
        # Convert to date object if it's a string
        if isinstance(row.date, str):
            date_obj = datetime.strptime(row.date, '%Y-%m-%d').date()
        elif isinstance(row.date, datetime):
            date_obj = row.date.date()
        else:
            date_obj = row.date
        
        results_dict[date_obj] = row.count
    
    # Fill missing dates
    trend = []
    current_date = start_date.date()
    end_date = datetime.utcnow().date()
    
    while current_date <= end_date:
        trend.append({
            "date": current_date.isoformat(),
            "jobs": results_dict.get(current_date, 0)
        })
        current_date += timedelta(days=1)
    
    return trend


def calculate_response_rate(
    db: Session,
    user_id: int
) -> float:
    """
    Calculate response rate for user applications
    This is a placeholder - requires an applications tracking table
    """
    # TODO: Implement when you add job applications tracking
    return 0.0


# ============================================================================
# USER ANALYTICS (For individual users)
# ============================================================================

@router.get("/user/dashboard")
def get_user_dashboard(
    time_range: TimeRange = Query(TimeRange.WEEK),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get personalized analytics dashboard for logged-in user
    """
    
    # Calculate date range
    start_date = get_start_date(time_range)
    
    # 1. Jobs matched to user
    total_jobs = 0
    if current_user.preferences:
        total_jobs = db.query(func.count(Job.id)).filter(
            Job.created_at >= start_date,
            Job.category.in_(current_user.preferences)
        ).scalar() or 0
    
    # 2. Notifications sent to user
    total_notifications = db.query(func.count(Notification.id)).filter(
        Notification.user_id == current_user.id,
        Notification.created_at >= start_date
    ).scalar() or 0
    
    # 3. Jobs by category breakdown
    jobs_by_category = []
    if current_user.preferences:
        category_results = db.query(
            Job.category,
            func.count(Job.id).label('count')
        ).filter(
            Job.created_at >= start_date,
            Job.category.in_(current_user.preferences)
        ).group_by(Job.category).all()
        
        jobs_by_category = [
            {"category": row.category, "count": row.count}
            for row in category_results
        ]
    
    # 4. Daily job trend (last 7 days)
    daily_trend = []
    if current_user.preferences:
        daily_trend = get_daily_job_trend(
            db, 
            current_user.preferences, 
            days=7
        )
    
    # 5. Response rate (if user tracks applications)
    response_rate = calculate_response_rate(db, current_user.id)
    
    # 6. Average jobs per day
    days_active = max((datetime.utcnow() - current_user.created_at).days, 1)
    avg_jobs_per_day = round(total_jobs / days_active, 1)
    
    return {
        "user": {
            "name": current_user.display_name or current_user.username or current_user.email,
            "avatar": current_user.profile_image,
            "member_since": current_user.created_at,
            "preferences": current_user.preferences
        },
        "summary": {
            "total_jobs_matched": total_jobs,
            "total_notifications": total_notifications,
            "avg_jobs_per_day": avg_jobs_per_day,
            "response_rate": response_rate
        },
        "breakdown": {
            "jobs_by_category": jobs_by_category,
            "daily_trend": daily_trend
        },
        "time_range": time_range
    }


@router.get("/user/jobs-trend")
def get_user_jobs_trend(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get daily job matching trend for specific user
    """
    trend = []
    if current_user.preferences:
         trend = get_daily_job_trend(db, current_user.preferences, days)
    
    return {"trend": trend, "days": days}


@router.get("/user/top-categories")
def get_user_top_categories(
    limit: int = Query(5, ge=1, le=20),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get top job categories for user
    """
    if not current_user.preferences:
        return {"categories": []}

    results = db.query(
        Job.category,
        func.count(Job.id).label('count')
    ).filter(
        Job.category.in_(current_user.preferences)
    ).group_by(Job.category).order_by(desc('count')).limit(limit).all()
    
    return {
        "categories": [
            {"category": row.category, "count": row.count}
            for row in results
        ]
    }


# ============================================================================
# ADMIN ANALYTICS (Platform-wide statistics)
# ============================================================================

@router.get("/admin/overview")
def get_admin_overview(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Admin dashboard overview - key metrics
    """
    
    # 1. Total users
    total_users = db.query(func.count(User.id)).scalar() or 0
    
    # 2. Active users (logged in last 7 days)
    week_ago = datetime.utcnow() - timedelta(days=7)
    active_users = db.query(func.count(User.id)).filter(
        User.last_login.is_not(None),
        User.last_login >= week_ago
    ).scalar() or 0
    
    # 3. Total jobs scraped
    total_jobs = db.query(func.count(Job.id)).scalar() or 0
    
    # 4. Jobs today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    jobs_today = db.query(func.count(Job.id)).filter(Job.created_at >= today_start).scalar() or 0
    
    # 5. Total notifications sent
    total_notifications = db.query(func.count(Notification.id)).scalar() or 0
    
    # 6. Notifications today
    notifications_today = db.query(func.count(Notification.id)).filter(
        Notification.created_at >= today_start
    ).scalar() or 0
    
    # 7. Duplicate detection rate
    total_duplicates = db.query(func.count(Job.id)).filter(Job.is_duplicate == True).scalar() or 0
    duplicate_rate = round((total_duplicates / total_jobs * 100), 1) if total_jobs > 0 else 0
    
    # 8. User growth (new users this week)
    new_users_week = db.query(func.count(User.id)).filter(User.created_at >= week_ago).scalar() or 0
    
    return {
        "users": {
            "total": total_users,
            "active_7d": active_users,
            "new_this_week": new_users_week,
            "active_percentage": round((active_users / total_users * 100), 1) if total_users > 0 else 0
        },
        "jobs": {
            "total": total_jobs,
            "today": jobs_today,
            "duplicates": total_duplicates,
            "duplicate_rate": f"{duplicate_rate}%"
        },
        "notifications": {
            "total": total_notifications,
            "today": notifications_today,
            "avg_per_user": round(total_notifications / total_users, 1) if total_users > 0 else 0
        }
    }


@router.get("/admin/users-growth")
def get_users_growth(
    days: int = Query(30, ge=7, le=365),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get daily user registration trend
    """
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Group users by registration date
    results = db.query(
        func.date(User.created_at).label('date'),
        func.count(User.id).label('count')
    ).filter(
        User.created_at >= start_date
    ).group_by(func.date(User.created_at)).order_by(func.date(User.created_at)).all()
    
    # Convert results to dict - handle both string and date objects
    results_dict = {}
    for row in results:
        if isinstance(row.date, str):
            date_obj = datetime.strptime(row.date, '%Y-%m-%d').date()
        elif isinstance(row.date, datetime):
            date_obj = row.date.date()
        else:
            date_obj = row.date
        
        results_dict[date_obj] = row.count
    
    # Fill in missing dates with 0
    trend = []
    current_date = start_date.date()
    end_date = datetime.utcnow().date()
    
    while current_date <= end_date:
        trend.append({
            "date": current_date.isoformat(),
            "new_users": results_dict.get(current_date, 0)
        })
        current_date += timedelta(days=1)
    
    return {"trend": trend, "days": days}


@router.get("/admin/jobs-stats")
def get_jobs_stats(
    days: int = Query(7, ge=1, le=90),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get detailed job statistics
    """
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # 1. Daily job scraping trend - use CASE for boolean to int conversion
    daily_results = db.query(
        func.date(Job.created_at).label('date'),
        func.count(Job.id).label('total'),
        func.sum(
            case(
                (Job.is_duplicate == True, 1),
                else_=0
            )
        ).label('duplicates')
    ).filter(
        Job.created_at >= start_date
    ).group_by(func.date(Job.created_at)).order_by(func.date(Job.created_at)).all()
    
    daily_trend = []
    for row in daily_results:
        dupes = int(row.duplicates or 0)
        total = int(row.total or 0)
        unique = total - dupes
        
        # Convert date to string
        if isinstance(row.date, str):
            date_str = row.date
        elif isinstance(row.date, datetime):
            date_str = row.date.date().isoformat()
        else:
            date_str = row.date.isoformat() if row.date else ""

        daily_trend.append({
            "date": date_str,
            "total_scraped": total,
            "duplicates": dupes,
            "unique_jobs": unique
        })
    
    # 2. Jobs by category
    category_results = db.query(
        Job.category,
        func.count(Job.id).label('count')
    ).filter(
        Job.created_at >= start_date,
        Job.is_duplicate == False
    ).group_by(Job.category).order_by(desc('count')).all()
    
    categories = [
        {"category": row.category, "count": row.count}
        for row in category_results
    ]
    
    return {
        "daily_trend": daily_trend,
        "categories": categories,
        "avg_budgets": []  # Placeholder - budget field not in current Job model
    }


@router.get("/admin/user-engagement")
def get_user_engagement(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get user engagement metrics
    """
    
    # 1. Users by notification preference (alert_speed)
    pref_results = db.query(
        User.alert_speed,
        func.count(User.id).label('count')
    ).group_by(User.alert_speed).all()
    
    preferences = [
        {"frequency": row.alert_speed or "not_set", "count": row.count}
        for row in pref_results
    ]
    
    # 2. Last active distribution
    now = datetime.utcnow()
    activity_ranges = [
        ("Today", 1),
        ("This week", 7),
        ("This month", 30),
        ("Inactive (30+ days)", None)
    ]
    
    activity_dist = []
    for label, days in activity_ranges:
        if days:
            cutoff = now - timedelta(days=days)
            count = db.query(func.count(User.id)).filter(
                User.last_login.is_not(None),
                User.last_login >= cutoff
            ).scalar() or 0
        else:
            cutoff = now - timedelta(days=30)
            count = db.query(func.count(User.id)).filter(
                or_(
                    User.last_login < cutoff,
                    User.last_login.is_(None)
                )
            ).scalar() or 0
        
        activity_dist.append({"period": label, "users": count})
    
    return {
        "notification_preferences": preferences,
        "activity_distribution": activity_dist
    }


@router.get("/admin/system-health")
def get_system_health(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get system health metrics
    """
    
    # 1. Scraping performance (jobs per hour)
    hour_ago = datetime.utcnow() - timedelta(hours=1)
    jobs_last_hour = db.query(func.count(Job.id)).filter(Job.created_at >= hour_ago).scalar() or 0
    
    # 2. Failed notifications (placeholder)
    failed_notifications = 0
    
    # 3. Database size estimates
    total_records = {
        "users": db.query(func.count(User.id)).scalar() or 0,
        "jobs": db.query(func.count(Job.id)).scalar() or 0,
        "notifications": db.query(func.count(Notification.id)).scalar() or 0
    }
    
    # 4. Oldest unprocessed job
    oldest_job = db.query(Job.created_at).order_by(Job.created_at).limit(1).scalar()
    
    return {
        "scraping": {
            "jobs_last_hour": jobs_last_hour,
            "avg_per_minute": round(jobs_last_hour / 60, 2)
        },
        "notifications": {
            "failed_last_24h": failed_notifications
        },
        "database": {
            "total_records": sum(total_records.values()),
            "breakdown": total_records
        },
        "queue": {
            "oldest_job": oldest_job
        },
        "status": "healthy" if jobs_last_hour > 0 else "warning"
    }