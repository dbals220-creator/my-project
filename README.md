# 더쿠 인기글 수집기

더쿠(theqoo.net) 인기글을 자동 수집하여 웹에서 편리하게 확인할 수 있는 시스템입니다.

## 프로젝트 구조

```
theqoo-collector/
├── crawler/           # 크롤러 모듈
│   ├── main.py        # 크롤러 메인
│   └── scheduler.py   # 스케줄러
├── backend/           # FastAPI 백엔드
│   ├── main.py        # API 서버
│   ├── database.py    # DB 연결
│   └── routers/       # API 라우터
├── frontend/          # Next.js 프론트엔드
├── theqoo.db          # SQLite 데이터베이스 (자동 생성)
└── requirements.txt   # Python 의존성
```

## 설치 및 실행

### 1. Python 의존성 설치

```bash
cd theqoo-collector
pip install -r requirements.txt
```

### 2. 크롤러 실행 (데이터 수집)

```bash
# 1회 실행
python crawler/main.py

# 스케줄러로 주기적 실행 (1시간마다)
python crawler/scheduler.py
```

### 3. 백엔드 서버 실행

```bash
cd backend
uvicorn main:app --reload --port 8000
```

API 문서: http://localhost:8000/docs

### 4. 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

웹사이트: http://localhost:3000

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/posts | 게시글 목록 조회 |
| GET | /api/posts/{post_id} | 단일 게시글 조회 |
| GET | /api/posts/categories | 카테고리 목록 |
| GET | /api/posts/stats | 통계 정보 |

### 쿼리 파라미터

- `limit`: 가져올 개수 (기본: 50, 최대: 100)
- `offset`: 시작 위치
- `category`: 카테고리 필터
- `search`: 제목 검색
- `sort_by`: 정렬 기준 (collected_at, view_count, comment_count)
- `order`: 정렬 순서 (asc, desc)

## 주의사항

- robots.txt를 준수하고 과도한 요청을 자제하세요
- 수집 주기는 1시간 이상으로 설정을 권장합니다
- 상업적 목적으로 사용하지 마세요
