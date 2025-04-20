import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: Request) {
  try {
    const { username, password, action } = await request.json()

    if (action === 'register') {
      const hashedPassword = await bcrypt.hash(password, 10)
      const [result] = await pool.execute(
        'INSERT INTO users (username, password) VALUES (?, ?)',
        [username, hashedPassword]
      )
      return NextResponse.json({ message: 'ユーザー登録が完了しました' })
    }

    if (action === 'login') {
      const [rows]: any = await pool.execute(
        'SELECT * FROM users WHERE username = ?',
        [username]
      )
      
      if (rows.length === 0) {
        return NextResponse.json(
          { error: 'ユーザーが見つかりません' },
          { status: 401 }
        )
      }

      const user = rows[0]
      const isValid = await bcrypt.compare(password, user.password)

      if (!isValid) {
        return NextResponse.json(
          { error: 'パスワードが正しくありません' },
          { status: 401 }
        )
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
        expiresIn: '24h',
      })

      return NextResponse.json({ token })
    }

    return NextResponse.json(
      { error: '不正なアクション' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: '認証中にエラーが発生しました' },
      { status: 500 }
    )
  }
} 