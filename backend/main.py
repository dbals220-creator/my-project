from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from routers import posts

app = FastAPI(
    title="더쿠 인기글 수집기 API",
    description="더쿠(theqoo.net) 인기글을 수집하고 조회하는 API",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(posts.router)


@app.get("/")
def root():
    return {
        "message": "더쿠 인기글 수집기 API",
        "docs": "/docs",
        "endpoints": {
            "posts": "/api/posts",
            "categories": "/api/posts/categories",
            "stats": "/api/posts/stats"
        }
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
