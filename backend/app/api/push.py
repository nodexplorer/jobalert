// FILE: backend/app/api/push.py
// ============================================================================

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from pywebpush import webpush, WebPushException
import json
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.push_subscription import PushSubscription
from app.config import settings

router = APIRouter()

# VAPID keys (generate with: webpush --gen-keypair)
VAPID_PRIVATE_KEY = settings.VAPID_PRIVATE_KEY
VAPID_PUBLIC_KEY = settings.VAPID_PUBLIC_KEY
VAPID_CLAIMS = {
    "sub": f"mailto:{settings.SMTP_USER}"
}


class PushSubscriptionRequest(BaseModel):
    endpoint: str
    keys: dict


@router.get("/push/vapid-public-key")
async def get_vapid_public_key():
    """Get VAPID public key for push subscriptions"""
    return {"publicKey": VAPID_PUBLIC_KEY}


@router.post("/push/subscribe")
async def subscribe_to_push(
    request: Request,
    subscription: PushSubscriptionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save push subscription for user"""
    
    # Check if subscription already exists
    existing = db.query(PushSubscription).filter(
        PushSubscription.endpoint == subscription.endpoint
    ).first()
    
    if existing:
        existing.is_active = True
        existing.last_used = func.now()
    else:
        # Create new subscription
        push_sub = PushSubscription(
            user_id=current_user.id,
            endpoint=subscription.endpoint,
            p256dh_key=subscription.keys['p256dh'],
            auth_key=subscription.keys['auth'],
            user_agent=request.headers.get('user-agent'),
            ip_address=request.client.host
        )
        db.add(push_sub)
    
    db.commit()
    
    return {"message": "Push subscription saved"}


@router.post("/push/unsubscribe")
async def unsubscribe_from_push(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Unsubscribe from push notifications"""
    
    db.query(PushSubscription).filter(
        PushSubscription.user_id == current_user.id
    ).update({"is_active": False})
    
    db.commit()
    
    return {"message": "Unsubscribed from push notifications"}


@router.post("/push/send-test")
async def send_test_push(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send test push notification"""
    
    subscriptions = db.query(PushSubscription).filter(
        PushSubscription.user_id == current_user.id,
        PushSubscription.is_active == True
    ).all()
    
    if not subscriptions:
        raise HTTPException(status_code=404, detail="No active subscriptions")
    
    sent_count = 0
    
    for sub in subscriptions:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {
                        "p256dh": sub.p256dh_key,
                        "auth": sub.auth_key
                    }
                },
                data=json.dumps({
                    "title": "Test Notification",
                    "body": "This is a test from X Job Bot!",
                    "icon": "/logos.png",
                    "url": "/dashboard"
                }),
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims=VAPID_CLAIMS
            )
            sent_count += 1
        except WebPushException as e:
            print(f"Push send failed: {e}")
            if e.response and e.response.status_code == 410:
                # Subscription expired, deactivate it
                sub.is_active = False
    
    db.commit()
    
    return {"message": f"Sent to {sent_count} device(s)"}


def send_push_notification(user_id: int, title: str, body: str, url: str, db: Session):
    """
    Send push notification to user
    Called by job scraping service when new job found
    """
    
    subscriptions = db.query(PushSubscription).filter(
        PushSubscription.user_id == user_id,
        PushSubscription.is_active == True
    ).all()
    
    for sub in subscriptions:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {
                        "p256dh": sub.p256dh_key,
                        "auth": sub.auth_key
                    }
                },
                data=json.dumps({
                    "title": title,
                    "body": body,
                    "icon": "/logos.png",
                    "url": url
                }),
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims=VAPID_CLAIMS
            )
            
            sub.last_used = func.now()
            
        except WebPushException as e:
            print(f"Push send failed: {e}")
            if e.response and e.response.status_code == 410:
                sub.is_active = False
    
    db.commit()