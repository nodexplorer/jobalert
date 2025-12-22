# FILE: backend/app/services/twitter_scraper.py

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from typing import List, Dict, Optional
from datetime import datetime
import time
import re
from app.models.job import Job
from app.models.notification import Notification
from app.models.user import User
from sqlalchemy.orm import Session
from app.services.notification_service import NotificationService

class TwitterScraper:
    """
    Selenium-based Twitter scraper for job postings
    Uses headless Chrome to scrape Twitter search results
    """
    
    def __init__(self, headless: bool = True):
        self.driver = None
        self.headless = headless
        self.setup_driver()
    
    def setup_driver(self):
        """Initialize Chrome driver with optimal settings"""
        options = Options()
        
        if self.headless:
            options.add_argument("--headless=new")
        
        # Essential options for stability
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1920,1080")
        options.add_argument("--disable-blink-features=AutomationControlled")
        
        # Avoid detection
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)
        
        # User agent
        options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=options)
        
        # Execute CDP to avoid detection
        self.driver.execute_cdp_cmd('Network.setUserAgentOverride', {
            "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })
        
        print("✅ Chrome driver initialized")
    
    def search_jobs(self, query: str, max_results: int = 20) -> List[Dict]:
        """
        Search Twitter for job posts
        
        Args:
            query: Search query (e.g., "video editor needed")
            max_results: Maximum number of results to return
        
        Returns:
            List of job dictionaries
        """
        jobs = []
        
        try:
            # Format search URL
            search_url = f"https://twitter.com/search?q={query.replace(' ', '%20')}&f=live"
            
            print(f"🔍 Searching Twitter: {query}")
            self.driver.get(search_url)
            
            # Wait for tweets to load
            time.sleep(3)
            
            # Scroll to load more tweets
            last_height = self.driver.execute_script("return document.body.scrollHeight")
            scroll_attempts = 0
            max_scrolls = 3
            
            while len(jobs) < max_results and scroll_attempts < max_scrolls:
                # Find all tweet articles
                tweets = self.driver.find_elements(By.CSS_SELECTOR, 'article[data-testid="tweet"]')
                
                print(f"📦 Found {len(tweets)} tweets on page")
                
                for tweet in tweets:
                    if len(jobs) >= max_results:
                        break
                    
                    try:
                        job_data = self._parse_tweet(tweet)
                        if job_data and self._is_valid_job(job_data):
                            # Check if we already have this tweet
                            if not any(j['tweet_id'] == job_data['tweet_id'] for j in jobs):
                                jobs.append(job_data)
                                print(f"✅ Parsed job: {job_data['tweet_id']}")
                    except Exception as e:
                        print(f"⚠️ Error parsing tweet: {e}")
                        continue
                
                # Scroll down
                self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(2)
                
                # Check if scrolled to bottom
                new_height = self.driver.execute_script("return document.body.scrollHeight")
                if new_height == last_height:
                    scroll_attempts += 1
                else:
                    scroll_attempts = 0
                    last_height = new_height
            
            print(f"✅ Collected {len(jobs)} jobs")
            
        except Exception as e:
            print(f"❌ Scraping error: {e}")
        
        return jobs
    
    def _parse_tweet(self, tweet_element) -> Optional[Dict]:
        """Parse a single tweet element"""
        try:
            # Get tweet link (contains tweet ID)
            time_elem = tweet_element.find_element(By.CSS_SELECTOR, 'time')
            link_elem = time_elem.find_element(By.XPATH, './ancestor::a')
            tweet_url = link_elem.get_attribute('href')
            
            if not tweet_url:
                return None
            
            # Extract tweet ID from URL
            tweet_id = tweet_url.split('/')[-1].split('?')[0]
            
            # Get username
            username_elem = tweet_element.find_element(
                By.CSS_SELECTOR,
                'div[data-testid="User-Name"] a'
            )
            username = username_elem.get_attribute('href').split('/')[-1]
            
            # Get author display name
            try:
                author_elem = tweet_element.find_element(
                    By.CSS_SELECTOR,
                    'div[data-testid="User-Name"] span'
                )
                author = author_elem.text
            except:
                author = username
            
            # Get tweet text
            try:
                text_elem = tweet_element.find_element(
                    By.CSS_SELECTOR,
                    'div[data-testid="tweetText"]'
                )
                text = text_elem.text
            except:
                text = ""
            
            # Get timestamp
            try:
                timestamp = time_elem.get_attribute('datetime')
            except:
                timestamp = datetime.now().isoformat()
            
            # Get engagement metrics
            engagement = {'likes': 0, 'retweets': 0, 'replies': 0}
            
            try:
                # Find metrics buttons
                metrics = tweet_element.find_elements(By.CSS_SELECTOR, 'div[role="group"] button')
                for i, metric in enumerate(metrics[:3]):
                    try:
                        count_text = metric.get_attribute('aria-label')
                        if count_text:
                            # Extract number from aria-label
                            numbers = re.findall(r'\d+', count_text)
                            if numbers:
                                count = int(numbers[0])
                                if i == 0:
                                    engagement['replies'] = count
                                elif i == 1:
                                    engagement['retweets'] = count
                                elif i == 2:
                                    engagement['likes'] = count
                    except:
                        continue
            except:
                pass
            
            return {
                'tweet_id': tweet_id,
                'tweet_url': tweet_url,
                'username': username,
                'author': author,
                'text': text,
                'posted_at': timestamp,
                'engagement': engagement
            }
            
        except Exception as e:
            print(f"Parse error: {e}")
            return None
    
    def _is_valid_job(self, job_data: Dict) -> bool:
        """Validate if tweet is a genuine job posting"""
        text = job_data.get('text', '').lower()
        
        # Must contain job indicators
        job_keywords = [
            'hiring', 'looking for', 'need', 'seeking', 'wanted',
            'opportunity', 'position', 'job', 'freelance', 'remote',
            'editor', 'developer', 'writer', 'designer'
        ]
        
        if not any(keyword in text for keyword in job_keywords):
            return False
        
        # Filter out spam
        spam_keywords = [
            'click link in bio', 'dm for details only',
            'follow me', 'check my profile', 'link in bio',
            'buy now', 'limited offer', 'act now'
        ]
        
        if any(spam in text for spam in spam_keywords):
            return False
        
        # Minimum text length
        if len(text) < 30:
            return False
        
        return True
    
    def close(self):
        """Close the browser"""
        if self.driver:
            self.driver.quit()
            print("✅ Browser closed")

