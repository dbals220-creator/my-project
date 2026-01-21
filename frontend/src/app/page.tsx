'use client'

import { useState, useEffect, useCallback } from 'react'

interface Post {
  id: number
  post_id: string
  category: string
  title: string
  url: string
  view_count: number
  comment_count: number
  published_at: string
  collected_at: string
}

interface Stats {
  total_posts: number
  today_collected: number
}

interface Category {
  category: string
  count: number
}

interface Keyword {
  rank: number
  keyword: string
  count: number
}

const API_BASE = ''

const KEYWORD_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
]

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [crawling, setCrawling] = useState(false)
  const [crawlResult, setCrawlResult] = useState<string | null>(null)
  const [readPosts, setReadPosts] = useState<Set<string>>(new Set())

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [sortBy, setSortBy] = useState('collected_at')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const limit = 30

  useEffect(() => {
    const saved = localStorage.getItem('readPosts')
    if (saved) {
      setReadPosts(new Set(JSON.parse(saved)))
    }
  }, [])

  const markAsRead = (postId: string) => {
    const newReadPosts = new Set(readPosts)
    newReadPosts.add(postId)
    setReadPosts(newReadPosts)
    localStorage.setItem('readPosts', JSON.stringify(Array.from(newReadPosts)))
  }

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String((page - 1) * limit),
        sort_by: sortBy,
        order: 'desc',
      })

      if (search) params.append('search', search)
      if (category) params.append('category', category)

      const res = await fetch(API_BASE + '/api/posts?' + params)
      if (!res.ok) throw new Error('Failed to fetch posts')

      const data = await res.json()
      setPosts(data.posts)
      setTotal(data.total)
    } catch (err) {
      setError('게시글을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [page, search, category, sortBy])

  const fetchStats = async () => {
    try {
      const res = await fetch(API_BASE + '/api/posts/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (err) {
      console.error('Stats fetch failed:', err)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch(API_BASE + '/api/posts/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
      }
    } catch (err) {
      console.error('Categories fetch failed:', err)
    }
  }

  const fetchKeywords = async () => {
    try {
      const res = await fetch(API_BASE + '/api/keywords/trending')
      if (res.ok) {
        const data = await res.json()
        setKeywords(data.keywords || [])
      }
    } catch (err) {
      console.error('Keywords fetch failed:', err)
    }
  }

  const runCrawler = async () => {
    setCrawling(true)
    setCrawlResult(null)
    try {
      const res = await fetch(API_BASE + '/api/crawler/run', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setCrawlResult('수집 완료: ' + data.fetched + '개 중 ' + data.saved + '개 신규 저장')
        fetchStats()
        fetchPosts()
        fetchCategories()
        fetchKeywords()
      } else {
        setCrawlResult('오류: ' + data.error)
      }
    } catch (err) {
      setCrawlResult('크롤링 실패')
    } finally {
      setCrawling(false)
      setTimeout(() => setCrawlResult(null), 5000)
    }
  }

  const handleKeywordClick = (keyword: string) => {
    setSearch(keyword)
    setPage(1)
  }

  useEffect(() => {
    fetchStats()
    fetchCategories()
    fetchKeywords()

    // 1시간마다 키워드 업데이트
    const interval = setInterval(fetchKeywords, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const totalPages = Math.ceil(total / limit)
  const formatNumber = (num: number) => num.toLocaleString('ko-KR')

  return (
    <>
      <header>
        <h1>더쿠 인기글 모음</h1>
        <button
          onClick={runCrawler}
          disabled={crawling}
          style={{
            padding: '8px 16px',
            backgroundColor: crawling ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: crawling ? 'not-allowed' : 'pointer',
            marginLeft: '16px'
          }}
        >
          {crawling ? '수집 중...' : '지금 수집하기'}
        </button>
        {crawlResult && (
          <span style={{ marginLeft: '12px', color: crawlResult.includes('오류') ? 'red' : 'green' }}>
            {crawlResult}
          </span>
        )}
      </header>

      {/* 실시간 인기 키워드 */}
      {keywords.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          padding: '16px 20px',
          marginBottom: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <span style={{
              color: '#FF6B6B',
              fontWeight: 'bold',
              fontSize: '14px',
              marginRight: '8px'
            }}>
              🔥 실시간 인기 키워드
            </span>
            <span style={{ color: '#888', fontSize: '12px' }}>
              (클릭하면 검색)
            </span>
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            {keywords.map((kw, idx) => (
              <button
                key={kw.keyword}
                onClick={() => handleKeywordClick(kw.keyword)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  color: 'white'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'
                  e.currentTarget.style.transform = 'scale(1.05)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                <span style={{
                  color: KEYWORD_COLORS[idx],
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}>
                  {kw.rank}
                </span>
                <span style={{ fontSize: '14px' }}>{kw.keyword}</span>
                <span style={{
                  fontSize: '11px',
                  color: '#888',
                  marginLeft: '2px'
                }}>
                  ({kw.count})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <main className="container">
        <div className="stats">
          <div className="stat-card">
            <div className="label">전체 수집</div>
            <div className="value">{stats ? formatNumber(stats.total_posts) : '-'}</div>
          </div>
          <div className="stat-card">
            <div className="label">오늘 수집</div>
            <div className="value">{stats ? formatNumber(stats.today_collected) : '-'}</div>
          </div>
        </div>

        <div className="filters">
          <input
            type="text"
            placeholder="제목 검색..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value)
              setPage(1)
            }}
          >
            <option value="">전체 카테고리</option>
            {categories.map((cat) => (
              <option key={cat.category} value={cat.category}>
                {cat.category} ({cat.count})
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value)
              setPage(1)
            }}
          >
            <option value="collected_at">최신순</option>
            <option value="view_count">조회수순</option>
            <option value="comment_count">댓글수순</option>
          </select>
        </div>

        {loading ? (
          <div className="loading">불러오는 중...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : posts.length === 0 ? (
          <div className="loading">게시글이 없습니다.</div>
        ) : (
          <div className="post-list">
            {posts.map((post) => (
              <div key={post.id} className={'post-item' + (readPosts.has(post.post_id) ? ' read' : '')}>
                {post.category && (
                  <span className="post-category">{post.category}</span>
                )}
                <div className="post-title">
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => markAsRead(post.post_id)}
                    style={{ color: readPosts.has(post.post_id) ? '#888' : undefined }}
                  >
                    {post.title}
                  </a>
                </div>
                <div className="post-meta">
                  <span>조회 {formatNumber(post.view_count)}</span>
                  <span>댓글 {formatNumber(post.comment_count)}</span>
                  <span>{post.published_at}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              이전
            </button>
            <span style={{ padding: '8px 16px' }}>
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              다음
            </button>
          </div>
        )}
      </main>
    </>
  )
}
