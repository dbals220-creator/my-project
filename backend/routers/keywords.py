from fastapi import APIRouter
from collections import Counter
import re
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import get_db

router = APIRouter(prefix="/api/keywords", tags=["keywords"])

# 제외할 단어들
STOPWORDS = {'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
             'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
             'jpg', 'gif', 'png', 'jpeg', 'ㅋㅋ', 'ㅋㅋㅋ', 'ㅋㅋㅋㅋ', 'ㅎㅎ', 'ㅎㅎㅎ',
             '있는', '하는', '되는', '했다', '한다', '이다', '있다', '없다', '된다',
             '그리고', '하지만', '그런데', '그래서', '또한', '이런', '저런', '어떤'}

def extract_keywords(title):
    # 한글, 영문 단어 추출 (2글자 이상)
    words = re.findall(r'[가-힣]{2,}|[a-zA-Z]{2,}', title)
    return [w for w in words if w.lower() not in STOPWORDS and len(w) >= 2]

@router.get("/trending")
def get_trending_keywords(limit: int = 10):
    with get_db() as conn:
        cursor = conn.cursor()
        # 최근 1시간 내 수집된 글 (또는 최근 50개)
        cursor.execute("""
            SELECT title FROM posts 
            ORDER BY collected_at DESC 
            LIMIT 100
        """)
        rows = cursor.fetchall()
    
    # 키워드 추출 및 카운트
    all_keywords = []
    for row in rows:
        keywords = extract_keywords(row['title'])
        all_keywords.extend(keywords)
    
    # 상위 키워드 추출
    keyword_counts = Counter(all_keywords)
    top_keywords = keyword_counts.most_common(limit)
    
    return {
        "keywords": [
            {"rank": i+1, "keyword": kw, "count": cnt}
            for i, (kw, cnt) in enumerate(top_keywords)
        ]
    }
