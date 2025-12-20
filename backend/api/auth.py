# backend/app/api/auth.py (FIXED)

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from tweepy import OAuth2UserHandler
import urllib.parse
from datetime import datetime
import tweepy
from app.core.database import get_db
from app.core.security import create_access_token, decode_access_token
from app.models.user import User
from app.config import settings

router = APIRouter()

# OAuth state storage (use Redis in production)
oauth_states = {}


@router.get("/auth/twitter/login")
def twitter_login():
    """
    Step 1: Redirect user to X OAuth page
    User clicks "Sign in with X" → calls this endpoint
    """
    # Initialize OAuth handler
    oauth = OAuth2UserHandler(
        client_id=settings.X_CLIENT_ID,
        redirect_uri=settings.X_CALLBACK_URL,
        scope=["tweet.read", "users.read"],  # Minimal permissions
        client_secret=settings.X_CLIENT_SECRET
    )
    
    # Get authorization URL - Tweepy generates state automatically
    auth_url = oauth.get_authorization_url()

    # Extract state from the generated URL
    parsed_url = urllib.parse.urlparse(auth_url)
    state = urllib.parse.parse_qs(parsed_url.query).get('state', [None])[0]

    if not state:
        raise HTTPException(status_code=500, detail="Failed to generate OAuth state")
    
    # Store state temporarily (expires in 10 minutes)
    oauth_states[state] = {
        "created_at": datetime.now()
    }
    
    # Redirect user to X login page
    return RedirectResponse(auth_url)


@router.get("/auth/callback")
async def twitter_callback(
    code: str,
    state: str,
    db: Session = Depends(get_db)
):
    """
    Step 2: X redirects back with authorization code
    Exchange code for access token and get user info
    """
    # Verify state (CSRF protection)
    if state not in oauth_states:
        error_url = f"{settings.FRONTEND_URL}/auth/error?message=Invalid+state"
        return RedirectResponse(error_url)
    
    # Remove used state
    del oauth_states[state]
    
    try:
        # Initialize OAuth handler
        oauth = OAuth2UserHandler(
            client_id=settings.X_CLIENT_ID,
            redirect_uri=settings.X_CALLBACK_URL,
            scope=["tweet.read", "users.read"],
            client_secret=settings.X_CLIENT_SECRET
        )
        
        # Exchange code for access token
        access_token_response = oauth.fetch_token(code)
        
        # Extract access token from response
        if isinstance(access_token_response, dict):
            access_token = access_token_response.get('access_token')
        else:
            access_token = access_token_response
        
        if not access_token:
            raise ValueError("Failed to get access token")
        
        # Get user info from X
        client = tweepy.Client(bearer_token=access_token)
        me = client.get_me(user_fields=['profile_image_url', 'username', 'name'])
        
        # Check if we got valid response
        if not me or not me.data:  # type: ignore
            raise ValueError("Failed to get user info from Twitter")
        
        twitter_user = me.data  # type: ignore
        
        # Check if user exists in database
        user = db.query(User).filter(User.twitter_id == str(twitter_user.id)).first()
        
        if not user:
            # Create new user
            user = User(
                twitter_id=str(twitter_user.id),
                username=twitter_user.username,
                email=f"{twitter_user.username}@twitter.placeholder",  # X doesn't give email
                display_name=twitter_user.name if hasattr(twitter_user, 'name') else twitter_user.username,
                profile_image=twitter_user.profile_image_url if hasattr(twitter_user, 'profile_image_url') else None,
                preferences=[],  # Will set later in onboarding
                keywords=[],
                alert_speed='instant',
                in_app_notifications=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
            # New user - redirect to onboarding
            is_new_user = True
        else:
            is_new_user = False
        
        # Create JWT token
        jwt_token = create_access_token(data={"sub": str(user.id)})
        
        # Redirect to frontend with token
        redirect_url = f"{settings.FRONTEND_URL}/auth/callback?token={jwt_token}&new_user={is_new_user}"
        return RedirectResponse(redirect_url)
    
    except Exception as e:
        print(f"OAuth error: {e}")
        import traceback
        traceback.print_exc()
        
        error_message = str(e).replace(' ', '+')
        error_url = f"{settings.FRONTEND_URL}/auth/error?message={error_message}"
        return RedirectResponse(error_url)


@router.get("/auth/me")
async def get_current_user_info(
    token: str,
    db: Session = Depends(get_db)
):
    """
    Get current user info from JWT token
    """
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "display_name": user.display_name,
        "profile_image": user.profile_image,
        "preferences": user.preferences,
        "created_at": user.created_at
    }
