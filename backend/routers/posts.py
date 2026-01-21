from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List
from pydantic import BaseModel
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import get_db

router = APIRouter(prefix="/api/posts", tags=["posts"])


class PostResponse(BaseModel):
    id: int
    post_id: str
    category: Optional[str]
    title: str
    url: str
    view_count: int
    comment_count: int
    published_at: Optional[str]
    collected_at: str

    class Config:
        from_attributes = True


class PostListResponse(BaseModel):
    total: int
    posts: List[dict]


@router.get("", response_model=PostListResponse)
def get_posts(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: str = Query("collected_at"),
    order: str = Query("desc")
):
    valid_sort_fields = ["collected_at", "view_count", "comment_count", "published_at"]
    if sort_by not in valid_sort_fields:
        sort_by = "collected_at"
    order = "DESC" if order.lower() == "desc" else "ASC"

    with get_db() as conn:
        cursor = conn.cursor()

        conditions = []
        params = []

        if category:
            conditions.append("category = ?")
            params.append(category)

        if search:
            conditions.append("title LIKE ?")
            params.append(f"%{search}%")

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

        cursor.execute(f"SELECT COUNT(*) as total FROM posts {where_clause}", params)
        total = cursor.fetchone()['total']

        query = f"""
            SELECT * FROM posts
            {where_clause}
            ORDER BY {sort_by} {order}
            LIMIT ? OFFSET ?
        """
        params.extend([limit, offset])
        cursor.execute(query, params)
        posts = cursor.fetchall()

        # datetime을 문자열로 변환
        for post in posts:
            if post.get('collected_at'):
                post['collected_at'] = str(post['collected_at'])

    return PostListResponse(total=total, posts=posts)


@router.get("/categories")
def get_categories():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT category, COUNT(*) as count
            FROM posts
            WHERE category IS NOT NULL AND category != ''
            GROUP BY category
            ORDER BY count DESC
        """)
        rows = cursor.fetchall()
    return rows


@router.get("/stats")
def get_stats():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM posts")
        total = cursor.fetchone()['count']

        cursor.execute("""
            SELECT COUNT(*) as count FROM posts
            WHERE DATE(collected_at) = DATE('now')
        """)
        today = cursor.fetchone()['count']

    return {"total_posts": total, "today_collected": today}


@router.get("/{post_id}")
def get_post(post_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM posts WHERE post_id = ?", (post_id,))
        row = cursor.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")

    if row.get('collected_at'):
        row['collected_at'] = str(row['collected_at'])
    return row
