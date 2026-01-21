import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '더쿠 인기글 모음',
  description: '더쿠 인기글을 한눈에 확인하세요',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
