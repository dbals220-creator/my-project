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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://43.203.251.128:8000'

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 필터 상태
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [sortBy, setSortBy] = useState('collected_at')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const limit = 30

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

      const res = await fetch(`${API_BASE}/api/posts?${params}`)
      if (!res.ok) throw new Error('Failed to fetch posts')

      const data = await res.json()
      setPosts(data.posts)
      setTotal(data.total)
    } catch (err) {
      setError('게시글을 불러오는데 실패했습니다. 백엔드 서버가 실행 중인지 확인하세요.')
    } finally {
      setLoading(false)
    }
  }, [page, search, category, sortBy])

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/posts/stats`)
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
      const res = await fetch(`${API_BASE}/api/posts/categories`)
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
      }
    } catch (err) {
      console.error('Categories fetch failed:', err)
    }
  }

  useEffect(() => {
    fetchStats()
    fetchCategories()
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
      </header>

      <main className="container">
        {/* 통계 */}
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

        {/* 필터 */}
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

        {/* 게시글 목록 */}
        {loading ? (
          <div className="loading">불러오는 중...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : posts.length === 0 ? (
          <div className="loading">게시글이 없습니다.</div>
        ) : (
          <div className="post-list">
            {posts.map((post) => (
              <div key={post.id} className="post-item">
                {post.category && (
                  <span className="post-category">{post.category}</span>
                )}
                <div className="post-title">
                  <a href={post.url} target="_blank" rel="noopener noreferrer">
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

        {/* 페이지네이션 */}
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
