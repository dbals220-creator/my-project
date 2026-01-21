from fastapi import APIRouter
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from crawler.main import TheqooCrawler

router = APIRouter(prefix="/api/crawler", tags=["crawler"])

@router.post("/run")
def run_crawler():
    try:
        crawler = TheqooCrawler()
        posts = crawler.fetch_hot_posts()
        saved = crawler.save_posts(posts)
        return {
            "success": True,
            "fetched": len(posts),
            "saved": saved,
            "message": f"수집 완료: {len(posts)}개 중 {saved}개 신규 저장"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
