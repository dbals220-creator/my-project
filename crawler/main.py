import requests
from bs4 import BeautifulSoup
import sqlite3
from datetime import datetime
import re
import sys
import os

# SQLite DB 경로
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'theqoo.db')


class TheqooCrawler:
    def __init__(self):
        self.base_url = 'https://theqoo.net'
        self.hot_url = f'{self.base_url}/hot'
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        }
        self.init_db()

    def get_connection(self):
        return sqlite3.connect(DB_PATH)

    def init_db(self):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS posts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                post_id TEXT UNIQUE,
                category TEXT,
                title TEXT,
                url TEXT,
                view_count INTEGER DEFAULT 0,
                comment_count INTEGER DEFAULT 0,
                published_at TEXT,
                collected_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_collected_at ON posts(collected_at)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_view_count ON posts(view_count)')
        conn.commit()
        conn.close()

    def fetch_hot_posts(self):
        try:
            response = requests.get(self.hot_url, headers=self.headers, timeout=10)
            response.raise_for_status()
            response.encoding = 'utf-8'
        except requests.RequestException as e:
            print(f"요청 실패: {e}")
            return []

        soup = BeautifulSoup(response.text, 'html.parser')
        posts = []

        for row in soup.select('table tbody tr'):
            try:
                post = self._parse_row(row)
                if post:
                    posts.append(post)
            except Exception as e:
                continue

        return posts

    def _parse_row(self, row):
        if 'notice' in row.get('class', []):
            return None

        title_cell = row.select_one('td.title')
        if not title_cell:
            return None

        title_link = title_cell.select_one('a[href*="/hot/"]')
        if not title_link:
            return None

        title_text = title_link.get_text(strip=True)
        href = title_link.get('href', '')

        post_id_match = re.search(r'/hot/(\d+)', href)
        post_id = post_id_match.group(1) if post_id_match else None
        if not post_id:
            return None

        category_elem = row.select_one('td.cate')
        category = category_elem.get_text(strip=True) if category_elem else ''

        view_elem = row.select_one('td.m_no')
        view_count = 0
        if view_elem:
            view_text = view_elem.get_text(strip=True).replace(',', '')
            view_count = int(view_text) if view_text.isdigit() else 0

        comment_elem = row.select_one('a.replyNum')
        comment_count = 0
        if comment_elem:
            comment_text = comment_elem.get_text(strip=True).replace(',', '')
            comment_count = int(comment_text) if comment_text.isdigit() else 0

        time_elem = row.select_one('td.time')
        published_at = time_elem.get_text(strip=True) if time_elem else ''

        return {
            'post_id': post_id,
            'category': category,
            'title': title_text.strip(),
            'url': f'{self.base_url}{href}' if href.startswith('/') else href,
            'view_count': view_count,
            'comment_count': comment_count,
            'published_at': published_at
        }

    def save_posts(self, posts):
        conn = self.get_connection()
        cursor = conn.cursor()
        saved_count = 0

        for post in posts:
            try:
                cursor.execute('''
                    INSERT OR IGNORE INTO posts
                    (post_id, category, title, url, view_count, comment_count, published_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    post['post_id'], post['category'], post['title'],
                    post['url'], post['view_count'], post['comment_count'],
                    post['published_at']
                ))
                if cursor.rowcount > 0:
                    saved_count += 1
            except Exception as e:
                print(f"저장 오류: {e}")

        conn.commit()
        conn.close()
        return saved_count

    def run(self):
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 크롤링 시작...")
        posts = self.fetch_hot_posts()
        saved = self.save_posts(posts)
        print(f"수집: {len(posts)}개, 신규 저장: {saved}개")
        return posts


if __name__ == '__main__':
    crawler = TheqooCrawler()
    crawler.run()
