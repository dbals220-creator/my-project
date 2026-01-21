import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const BACKEND_URL = 'http://localhost:8001'

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/posts/categories`, { cache: 'no-store' })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Backend error' }, { status: 500 })
  }
}
