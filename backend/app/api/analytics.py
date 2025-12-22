# backend/app/api/analytics.py
"""
Analytics API - User & Admin Statistics
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from datetime import datetime, timedelta
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
# USER ANALYTICS (For individual users)
# ============================================================================

@router.get("/user/dashboard")
async def get_user_dashboard(
    time_range: TimeRange = Query(TimeRange.WEEK),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get personalized analytics dashboard for logged-in user
    """
    
    # Calculate date range
    start_date = get_start_date(time_range)
    
    # 1. Jobs matched to user
    jobs_query = select(func.count(Job.id)).where(
        and_(
            Job.created_at >= start_date,
            Job.category.in_(current_user.preferences)
        )
    )
    total_jobs = (await db.execute(jobs_query)).scalar()
    
    # 2. Notifications sent to user
    notifications_query = select(func.count(Notification.id)).where(
        and_(
            Notification.user_id == current_user.id,
            Notification.created_at >= start_date
        )
    )
    total_notifications = (await db.execute(notifications_query)).scalar()
    
    # 3. Jobs by category breakdown
    category_query = select(
        Job.category,
        func.count(Job.id).label('count')
    ).where(
        and_(
            Job.created_at >= start_date,
            Job.category.in_(current_user.preferences)
        )
    ).group_by(Job.category)
    
    category_results = (await db.execute(category_query)).all()
    jobs_by_category = [
        {"category": row.category, "count": row.count}
        for row in category_results
    ]
    
    # 4. Daily job trend (last 7 days)
    daily_trend = await get_daily_job_trend(
        db, 
        current_user.preferences, 
        days=7
    )
    
    # 5. Response rate (if user tracks applications)
    # This would require an applications table - placeholder for now
    response_rate = await calculate_response_rate(db, current_user.id)
    
    # 6. Average jobs per day
    days_active = (datetime.utcnow() - current_user.created_at).days or 1
    avg_jobs_per_day = round(total_jobs / days_active, 1)
    
    return {
        "user": {
            "name": current_user.twitter_name or current_user.email,
            "avatar": current_user.twitter_avatar,
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
async def get_user_jobs_trend(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get daily job matching trend for specific user
    """
    trend = await get_daily_job_trend(db, current_user.preferences, days)
    return {"trend": trend, "days": days}


@router.get("/user/top-categories")
async def get_user_top_categories(
    limit: int = Query(5, ge=1, le=20),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get top job categories for user
    """
    query = select(
        Job.category,
        func.count(Job.id).label('count')
    ).where(
        Job.category.in_(current_user.preferences)
    ).group_by(Job.category).order_by(desc('count')).limit(limit)
    
    results = (await db.execute(query)).all()
    
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
async def get_admin_overview(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin dashboard overview - key metrics
    """
    
    # 1. Total users
    total_users = (await db.execute(
        select(func.count(User.id))
    )).scalar()
    
    # 2. Active users (logged in last 7 days)
    week_ago = datetime.utcnow() - timedelta(days=7)
    active_users = (await db.execute(
        select(func.count(User.id)).where(
            User.last_login >= week_ago
        )
    )).scalar()
    
    # 3. Total jobs scraped
    total_jobs = (await db.execute(
        select(func.count(Job.id))
    )).scalar()
    
    # 4. Jobs today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0)
    jobs_today = (await db.execute(
        select(func.count(Job.id)).where(
            Job.created_at >= today_start
        )
    )).scalar()
    
    # 5. Total notifications sent
    total_notifications = (await db.execute(
        select(func.count(Notification.id))
    )).scalar()
    
    # 6. Notifications today
    notifications_today = (await db.execute(
        select(func.count(Notification.id)).where(
            Notification.created_at >= today_start
        )
    )).scalar()
    
    # 7. Duplicate detection rate
    total_duplicates = (await db.execute(
        select(func.count(Job.id)).where(Job.is_duplicate == True)
    )).scalar()
    duplicate_rate = round((total_duplicates / total_jobs * 100), 1) if total_jobs > 0 else 0
    
    # 8. User growth (new users this week)
    new_users_week = (await db.execute(
        select(func.count(User.id)).where(
            User.created_at >= week_ago
        )
    )).scalar()
    
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
async def get_users_growth(
    days: int = Query(30, ge=7, le=365),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Get daily user registration trend
    """
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Group users by registration date
    query = select(
        func.date(User.created_at).label('date'),
        func.count(User.id).label('count')
    ).where(
        User.created_at >= start_date
    ).group_by(func.date(User.created_at)).order_by('date')
    
    results = (await db.execute(query)).all()
    
    # Fill in missing dates with 0
    trend = []
    current_date = start_date.date()
    end_date = datetime.utcnow().date()
    results_dict = {row.date: row.count for row in results}
    
    while current_date <= end_date:
        trend.append({
            "date": current_date.isoformat(),
            "new_users": results_dict.get(current_date, 0)
        })
        current_date += timedelta(days=1)
    
    return {"trend": trend, "days": days}


@router.get("/admin/jobs-stats")
async def get_jobs_stats(
    days: int = Query(7, ge=1, le=90),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed job statistics
    """
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # 1. Daily job scraping trend
    daily_query = select(
        func.date(Job.created_at).label('date'),
        func.count(Job.id).label('total'),
        func.sum(func.cast(Job.is_duplicate, func.INTEGER)).label('duplicates')
    ).where(
        Job.created_at >= start_date
    ).group_by(func.date(Job.created_at)).order_by('date')
    
    daily_results = (await db.execute(daily_query)).all()
    
    daily_trend = []
    for row in daily_results:
        daily_trend.append({
            "date": row.date.isoformat(),
            "total_scraped": row.total,
            "duplicates": row.duplicates or 0,
            "unique_jobs": row.total - (row.duplicates or 0)
        })
    
    # 2. Jobs by category
    category_query = select(
        Job.category,
        func.count(Job.id).label('count')
    ).where(
        and_(
            Job.created_at >= start_date,
            Job.is_duplicate == False
        )
    ).group_by(Job.category).order_by(desc('count'))
    
    category_results = (await db.execute(category_query)).all()
    categories = [
        {"category": row.category, "count": row.count}
        for row in category_results
    ]
    
    # 3. Average budget by category
    budget_query = select(
        Job.category,
        func.avg(Job.budget).label('avg_budget')
    ).where(
        and_(
            Job.created_at >= start_date,
            Job.is_duplicate == False,
            Job.budget.isnot(None)
        )
    ).group_by(Job.category)
    
    budget_results = (await db.execute(budget_query)).all()
    budgets = [
        {"category": row.category, "avg_budget": round(row.avg_budget, 2)}
        for row in budget_results
    ]
    
    return {
        "daily_trend": daily_trend,
        "categories": categories,
        "avg_budgets": budgets
    }


@router.get("/admin/user-engagement")
async def get_user_engagement(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Get user engagement metrics
    """
    
    # 1. Users by notification preference
    pref_query = select(
        User.notification_frequency,
        func.count(User.id).label('count')
    ).group_by(User.notification_frequency)
    
    pref_results = (await db.execute(pref_query)).all()
    preferences = [
        {"frequency": row.notification_frequency, "count": row.count}
        for row in pref_results
    ]
    
    # 2. Users by number of job categories
    category_query = select(
        func.array_length(User.preferences, 1).label('category_count'),
        func.count(User.id).label('user_count')
    ).group_by('category_count').order_by('category_count')
    
    category_results = (await db.execute(category_query)).all()
    categories_per_user = [
        {"categories": row.category_count or 0, "users": row.user_count}
        for row in category_results
    ]
    
    # 3. Last active distribution
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
            count = (await db.execute(
                select(func.count(User.id)).where(
                    User.last_login >= cutoff
                )
            )).scalar()
        else:
            cutoff = now - timedelta(days=30)
            count = (await db.execute(
                select(func.count(User.id)).where(
                    or_(
                        User.last_login < cutoff,
                        User.last_login.is_(None)
                    )
                )
            )).scalar()
        
        activity_dist.append({"period": label, "users": count})
    
    return {
        "notification_preferences": preferences,
        "categories_per_user": categories_per_user,
        "activity_distribution": activity_dist
    }


@router.get("/admin/system-health")
async def get_system_health(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Get system health metrics
    """
    
    # 1. Scraping performance (jobs per hour)
    hour_ago = datetime.utcnow() - timedelta(hours=1)
    jobs_last_hour = (await db.execute(
        select(func.count(Job.id)).where(
            Job.created_at >= hour_ago
        )
    )).scalar()
    
    # 2. Failed notifications (if you track this)
    # Placeholder - requires notification status tracking
    failed_notifications = 0
    
    # 3. Database size estimates
    total_records = {
        "users": (await db.execute(select(func.count(User.id)))).scalar(),
        "jobs": (await db.execute(select(func.count(Job.id)))).scalar(),
        "notifications": (await db.execute(select(func.count(Notification.id)))).scalar()
    }
    
    # 4. Oldest unprocessed job (queue health)
    oldest_job = (await db.execute(
        select(Job.created_at).order_by(Job.created_at).limit(1)
    )).scalar()
    
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


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_start_date(time_range: TimeRange) -> datetime:
    """Convert time range enum to start date"""
    now = datetime.utcnow()
    
    if time_range == TimeRange.TODAY:
        return now.replace(hour=0, minute=0, second=0)
    elif time_range == TimeRange.WEEK:
        return now - timedelta(days=7)
    elif time_range == TimeRange.MONTH:
        return now - timedelta(days=30)
    elif time_range == TimeRange.YEAR:
        return now - timedelta(days=365)
    else:  # ALL
        return datetime.min


async def get_daily_job_trend(
    db: AsyncSession,
    categories: List[str],
    days: int
) -> List[dict]:
    """Get daily job count trend for specific categories"""
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    query = select(
        func.date(Job.created_at).label('date'),
        func.count(Job.id).label('count')
    ).where(
        and_(
            Job.created_at >= start_date,
            Job.category.in_(categories),
            Job.is_duplicate == False
        )
    ).group_by(func.date(Job.created_at)).order_by('date')
    
    results = (await db.execute(query)).all()
    
    # Fill missing dates
    trend = []
    current_date = start_date.date()
    end_date = datetime.utcnow().date()
    results_dict = {row.date: row.count for row in results}
    
    while current_date <= end_date:
        trend.append({
            "date": current_date.isoformat(),
            "jobs": results_dict.get(current_date, 0)
        })
        current_date += timedelta(days=1)
    
    return trend


async def calculate_response_rate(
    db: AsyncSession,
    user_id: int
) -> float:
    """
    Calculate response rate for user applications
    This is a placeholder - requires an applications tracking table
    """
    # TODO: Implement when you add job applications tracking
    return 0.0