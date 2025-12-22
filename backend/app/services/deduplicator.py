# backend/app/services/deduplicator.py
"""
Job Deduplication Service
Prevents sending duplicate job alerts to users
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from datetime import datetime, timedelta
import re
import hashlib
from difflib import SequenceMatcher
from typing import Optional, List, Tuple

from app.models.job import Job
from app.core.database import get_db


class JobDeduplicator:
    """
    Multi-level deduplication strategy:
    1. Exact URL match (same tweet)
    2. Content fingerprint (exact text copy)
    3. Fuzzy text similarity (rephrased job)
    4. Contact info match (same client)
    """
    
    SIMILARITY_THRESHOLD = 0.85  # 85% similar = duplicate
    LOOKBACK_HOURS = 48  # Only check jobs from last 48 hours
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def check_duplicate(self, new_job: dict) -> Tuple[bool, Optional[int]]:
        """
        Check if job is duplicate of existing job.
        
        Returns:
            (is_duplicate: bool, original_job_id: Optional[int])
        """
        
        # Level 1: Exact URL match (fastest check)
        if new_job.get('url'):
            existing = await self._check_url_match(new_job['url'])
            if existing:
                return True, existing.id
        
        # Level 2: Content fingerprint (exact text)
        fingerprint = self._create_fingerprint(new_job['description'])
        existing = await self._check_fingerprint_match(fingerprint)
        if existing:
            return True, existing.id
        
        # Level 3: Fuzzy similarity (rephrased jobs)
        existing = await self._check_fuzzy_match(new_job)
        if existing:
            return True, existing.id
        
        # Level 4: Contact info match + similar content
        existing = await self._check_contact_match(new_job)
        if existing:
            return True, existing.id
        
        return False, None
    
    # ========================================================================
    # LEVEL 1: URL MATCHING (Exact duplicate tweet)
    # ========================================================================
    
    async def _check_url_match(self, url: str) -> Optional[Job]:
        """Check if exact same tweet URL exists"""
        cutoff_time = datetime.utcnow() - timedelta(hours=self.LOOKBACK_HOURS)
        
        result = await self.db.execute(
            select(Job)
            .where(
                and_(
                    Job.url == url,
                    Job.created_at >= cutoff_time
                )
            )
            .limit(1)
        )
        return result.scalar_one_or_none()
    
    # ========================================================================
    # LEVEL 2: CONTENT FINGERPRINTING (Exact text copy)
    # ========================================================================
    
    def _create_fingerprint(self, text: str) -> str:
        """
        Create a hash fingerprint of normalized text.
        This catches exact copies even if formatting changes.
        """
        # Normalize text: lowercase, remove extra spaces, remove special chars
        normalized = re.sub(r'[^\w\s]', '', text.lower())
        normalized = ' '.join(normalized.split())
        
        # Create SHA256 hash
        return hashlib.sha256(normalized.encode()).hexdigest()
    
    async def _check_fingerprint_match(self, fingerprint: str) -> Optional[Job]:
        """Check if job with same content fingerprint exists"""
        cutoff_time = datetime.utcnow() - timedelta(hours=self.LOOKBACK_HOURS)
        
        result = await self.db.execute(
            select(Job)
            .where(
                and_(
                    Job.content_fingerprint == fingerprint,
                    Job.created_at >= cutoff_time
                )
            )
            .limit(1)
        )
        return result.scalar_one_or_none()
    
    # ========================================================================
    # LEVEL 3: FUZZY TEXT MATCHING (Rephrased jobs)
    # ========================================================================
    
    async def _check_fuzzy_match(self, new_job: dict) -> Optional[Job]:
        """
        Check for similar jobs using fuzzy text matching.
        This is the most expensive check, so we do it last.
        """
        cutoff_time = datetime.utcnow() - timedelta(hours=self.LOOKBACK_HOURS)
        
        # Get recent jobs in same category
        result = await self.db.execute(
            select(Job)
            .where(
                and_(
                    Job.category == new_job.get('category'),
                    Job.created_at >= cutoff_time,
                    Job.is_duplicate == False
                )
            )
            .limit(50)  # Only check last 50 jobs for performance
        )
        existing_jobs = result.scalars().all()
        
        new_text = self._normalize_for_comparison(new_job['description'])
        
        for existing_job in existing_jobs:
            existing_text = self._normalize_for_comparison(existing_job.description)
            
            # Calculate similarity score
            similarity = self._calculate_similarity(new_text, existing_text)
            
            if similarity >= self.SIMILARITY_THRESHOLD:
                # Also check if budget is similar (if both have budgets)
                if self._budgets_match(new_job, existing_job):
                    return existing_job
        
        return None
    
    def _normalize_for_comparison(self, text: str) -> str:
        """
        Normalize text for fuzzy matching.
        Remove noise but keep meaningful content.
        """
        # Convert to lowercase
        text = text.lower()
        
        # Remove URLs
        text = re.sub(r'http\S+|www\.\S+', '', text)
        
        # Remove mentions and hashtags
        text = re.sub(r'@\w+|#\w+', '', text)
        
        # Remove special characters but keep spaces
        text = re.sub(r'[^\w\s]', ' ', text)
        
        # Remove extra whitespace
        text = ' '.join(text.split())
        
        return text
    
    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """
        Calculate similarity ratio between two texts.
        Returns float between 0.0 and 1.0
        """
        return SequenceMatcher(None, text1, text2).ratio()
    
    def _budgets_match(self, new_job: dict, existing_job: Job) -> bool:
        """
        Check if budgets are similar.
        Jobs with same description but different budgets are NOT duplicates.
        """
        new_budget = new_job.get('budget')
        existing_budget = existing_job.budget
        
        # If either has no budget, assume match
        if not new_budget or not existing_budget:
            return True
        
        # If budgets within 20% of each other, consider them same
        ratio = min(new_budget, existing_budget) / max(new_budget, existing_budget)
        return ratio >= 0.8
    
    # ========================================================================
    # LEVEL 4: CONTACT INFO MATCHING (Same client posting multiple times)
    # ========================================================================
    
    async def _check_contact_match(self, new_job: dict) -> Optional[Job]:
        """
        Check if same contact info (email, telegram, twitter) + similar job.
        Example: Same person posting same job multiple times.
        """
        contact_info = self._extract_contact_info(new_job['description'])
        
        if not contact_info:
            return None
        
        cutoff_time = datetime.utcnow() - timedelta(hours=self.LOOKBACK_HOURS)
        
        # Find jobs with matching contact info
        result = await self.db.execute(
            select(Job)
            .where(
                and_(
                    Job.category == new_job.get('category'),
                    Job.created_at >= cutoff_time,
                    Job.is_duplicate == False,
                    or_(
                        *[Job.description.ilike(f'%{contact}%') 
                          for contact in contact_info]
                    )
                )
            )
            .limit(10)
        )
        existing_jobs = result.scalars().all()
        
        # If we find jobs with same contact AND similar text, it's duplicate
        new_text = self._normalize_for_comparison(new_job['description'])
        
        for existing_job in existing_jobs:
            existing_text = self._normalize_for_comparison(existing_job.description)
            similarity = self._calculate_similarity(new_text, existing_text)
            
            # Lower threshold for contact matches (70% instead of 85%)
            if similarity >= 0.70:
                return existing_job
        
        return None
    
    def _extract_contact_info(self, text: str) -> List[str]:
        """
        Extract email addresses, telegram handles, twitter handles.
        """
        contacts = []
        
        # Email regex
        emails = re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
        contacts.extend(emails)
        
        # Telegram handles (@username)
        telegram = re.findall(r'@[\w]{5,}', text)
        contacts.extend(telegram)
        
        # Remove duplicates and normalize
        return list(set([c.lower() for c in contacts]))
    
    # ========================================================================
    # HELPER: Mark job as duplicate
    # ========================================================================
    
    async def mark_as_duplicate(self, job_id: int, original_job_id: int):
        """Mark a job as duplicate and link to original"""
        result = await self.db.execute(
            select(Job).where(Job.id == job_id)
        )
        job = result.scalar_one_or_none()
        
        if job:
            job.is_duplicate = True
            job.original_job_id = original_job_id
            await self.db.commit()


# ============================================================================
# USAGE EXAMPLE
# ============================================================================

async def process_scraped_job(job_data: dict, db: AsyncSession):
    """
    Example of how to use deduplicator in scraping pipeline
    """
    deduplicator = JobDeduplicator(db)
    
    # Check if duplicate
    is_duplicate, original_id = await deduplicator.check_duplicate(job_data)
    
    if is_duplicate:
        print(f"⚠️ Duplicate job found! Original: {original_id}")
        # Don't notify users
        return None
    
    # Create new job
    fingerprint = deduplicator._create_fingerprint(job_data['description'])
    
    new_job = Job(
        title=job_data['title'],
        description=job_data['description'],
        url=job_data.get('url'),
        category=job_data['category'],
        budget=job_data.get('budget'),
        content_fingerprint=fingerprint,
        is_duplicate=False
    )
    
    db.add(new_job)
    await db.commit()
    
    print(f"✅ New job saved: {new_job.id}")
    return new_job