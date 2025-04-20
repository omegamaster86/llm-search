import { NextResponse } from 'next/server'
import { pool, redis } from '../../../lib/db'
import { search } from '../../../lib/search'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// 検索結果をキャッシュする時間（秒）
const CACHE_DURATION = 3600

async function verifyToken(token: string): Promise<number | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number }
    return decoded.userId
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  try {
    const { query } = await request.json()
    const token = request.headers.get('Authorization')?.split(' ')[1]
    const userId = token ? await verifyToken(token) : null

    // キャッシュをチェック
    const cacheKey = `search:${query}`
    const cachedResult = await redis.get(cacheKey)
    
    if (cachedResult) {
      // 検索履歴を保存（キャッシュヒット時も）
      if (userId) {
        await pool.execute(
          'INSERT INTO search_history (user_id, query, result) VALUES (?, ?, ?)',
          [userId, query, cachedResult]
        )
      }

      return NextResponse.json({
        role: 'assistant',
        content: cachedResult,
        cached: true,
      })
    }

    // 統合検索を実行
    const searchResult = await search(query)

    // 結果をキャッシュ
    await redis.setex(cacheKey, CACHE_DURATION, searchResult)

    // 検索履歴を保存
    if (userId) {
      await pool.execute(
        'INSERT INTO search_history (user_id, query, result) VALUES (?, ?, ?)',
        [userId, query, searchResult]
      )
    }

    return NextResponse.json({
      role: 'assistant',
      content: searchResult,
      cached: false,
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: '検索中にエラーが発生しました' },
      { status: 500 }
    )
  }
} 