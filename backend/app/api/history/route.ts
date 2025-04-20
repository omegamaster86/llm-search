import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

async function verifyToken(token: string): Promise<number | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number }
    return decoded.userId
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1]
    
    if (!token) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const userId = await verifyToken(token)
    if (!userId) {
      return NextResponse.json(
        { error: '無効なトークンです' },
        { status: 401 }
      )
    }

    // 検索履歴を取得
    const [rows] = await pool.execute(
      'SELECT query, result, created_at FROM search_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [userId]
    )

    return NextResponse.json({ history: rows })
  } catch (error) {
    console.error('History fetch error:', error)
    return NextResponse.json(
      { error: '履歴の取得中にエラーが発生しました' },
      { status: 500 }
    )
  }
} 