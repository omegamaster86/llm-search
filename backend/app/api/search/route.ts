import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { query } = await request.json()

    // 検索ロジックの実装
    const searchResults = await prisma.searchHistory.create({
      data: {
        query,
        result: `検索結果: ${query}に関する情報です。`, // 実際の検索ロジックに置き換え
      },
    })

    return NextResponse.json({
      role: 'assistant',
      content: searchResults.result,
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: '検索中にエラーが発生しました' },
      { status: 500 }
    )
  }
} 