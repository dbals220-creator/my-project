import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const BACKEND_URL = 'http://localhost:8001'

export async function POST() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/crawler/run`, {
      method: 'POST',
      cache: 'no-store'
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Backend error' }, { status: 500 })
  }
}
