from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from routers import posts, crawler, keywords

app = FastAPI(
    title="더쿠 인기글 수집기 API",
    description="더쿠(theqoo.net) 인기글을 수집하고 조회하는 API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(posts.router)
app.include_router(crawler.router)
app.include_router(keywords.router)

@app.get("/")
def root():
    return {"message": "더쿠 인기글 수집기 API", "docs": "/docs"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
