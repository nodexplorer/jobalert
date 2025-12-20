# backend/app/main.py

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from app.config import settings
from app.core.database import get_db, engine, Base
from app.core.security import hash_password, verify_password, create_access_token, get_current_user
from app.models.user import User
from app.models.job import Job
from app.schemas.user import UserCreate, UserLogin, UserResponse, UserOnboarding
from app.schemas.job import JobResponse
from api.auth import router as auth_router
from api.settings import router as settings_router

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth_router, prefix="/api")
app.include_router(settings_router, prefix="/api")

@app.post("/api/auth/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    """Register new user"""
    # Check if user exists
    existing = db.query(User).filter(User.email == user.email).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Create user
    db_user = User(
        email=user.email,
        hashed_password=hash_password(user.password),
        preferences=user.preferences
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@app.post("/api/auth/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    """Login user"""
    db_user = db.query(User).filter(User.email == user.email).first()
    
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": str(db_user.id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(db_user)
    }

@app.post("/api/auth/onboarding", response_model=UserResponse)
def onboarding(
    data: UserOnboarding,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Complete user onboarding"""
    db_user = db.query(User).filter(User.id == current_user.id).first()
    
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update user with onboarding data
    if data.telegram_id:
        db_user.telegram_chat_id = data.telegram_id
    db_user.preferences = data.preferences
    db_user.alert_frequency = data.alert_frequency
    db_user.in_app_notifications = data.in_app_notifications
    
    db.commit()
    db.refresh(db_user)
    
    return db_user

@app.get("/api/jobs", response_model=List[JobResponse])
def get_jobs(
    category: str = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get recent jobs"""
    query = db.query(Job).order_by(Job.created_at.desc())
    
    if category:
        query = query.filter(Job.category == category)
    
    jobs = query.limit(limit).all()
    return jobs

@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    """Get platform statistics"""
    total_jobs = db.query(Job).count()
    total_users = db.query(User).count()
    
    return {
        "total_jobs": total_jobs,
        "total_users": total_users,
        "jobs_today": 0  # TODO: Calculate
    }

@app.get("/")
def root():
    return {"message": f"{settings.APP_NAME} API is running!"}