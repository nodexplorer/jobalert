# backend/app/services/scraper.py

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.webdriver import WebDriver
from webdriver_manager.chrome import ChromeDriverManager
from typing import List, Dict, Optional
from datetime import datetime
import time

class TwitterScraper:
    """Scrapes Twitter/X for job postings"""
    
    def __init__(self, headless: bool = True):
        self.driver: Optional[WebDriver] = None
        self.headless = headless
    
    def setup(self):
        """Initialize Chrome driver"""
        options = Options()
        if self.headless:
            options.add_argument("--headless")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
        
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=options)
    
    def search_jobs(self, query: str, category: str, max_results: int = 20) -> List[Dict]:
        """Search Twitter for jobs"""
        if not self.driver:
            self.setup()
        
        assert self.driver is not None, "Driver failed to initialize"
        jobs = []
        url = f"https://twitter.com/search?q={query.replace(' ', '%20')}&f=live"
        
        try:
            self.driver.get(url)
            time.sleep(3)
            
            tweets = self.driver.find_elements(By.CSS_SELECTOR, 'article[data-testid="tweet"]')
            
            for tweet in tweets[:max_results]:
                try:
                    job = self._parse_tweet(tweet, category)
                    if job:
                        jobs.append(job)
                except:
                    continue
        
        except Exception as e:
            print(f"Scraping error: {e}")
        
        return jobs
    
    def _parse_tweet(self, tweet_element, category: str) -> Dict:
        """Parse tweet element into job dict"""
        try:
            # Get tweet URL
            time_elem = tweet_element.find_element(By.CSS_SELECTOR, 'time')
            link = time_elem.find_element(By.XPATH, './ancestor::a')
            tweet_url = link.get_attribute('href')
            tweet_id = tweet_url.split('/')[-1]
            
            # Get author
            author = tweet_element.find_element(
                By.CSS_SELECTOR, 
                'div[data-testid="User-Name"] span'
            ).text
            
            # Get username
            username_elem = tweet_element.find_element(
                By.CSS_SELECTOR,
                'div[data-testid="User-Name"] a'
            )
            username = username_elem.get_attribute('href').split('/')[-1]
            
            # Get text
            text_elem = tweet_element.find_element(By.CSS_SELECTOR, 'div[data-testid="tweetText"]')
            text = text_elem.text
            
            # Get timestamp
            timestamp = time_elem.get_attribute('datetime')
            
            return {
                'tweet_id': tweet_id,
                'tweet_url': tweet_url,
                'author': author,
                'username': username,
                'text': text,
                'category': category,
                'posted_at': timestamp,
                'engagement': {'likes': 0, 'retweets': 0}
            }
        
        except Exception as e:
            raise e
    
    def close(self):
        """Close browser"""
        if self.driver:
            self.driver.quit()
