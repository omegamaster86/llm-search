'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const Dashboard = () => {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 認証チェック
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/')
    }
  }, [router])

  // メッセージ履歴の永続化
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatMessages')
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages))
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    setIsLoading(true)
    setError(null)

    // ユーザーのメッセージを追加
    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ query: input }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/')
          return
        }
        throw new Error('検索に失敗しました')
      }

      const data = await response.json()
      setMessages(prev => [...prev, data])
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('chatMessages')
    router.push('/')
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">社内検索システム</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm text-red-600 hover:text-red-700"
        >
          ログアウト
        </button>
      </div>

      {/* メッセージ履歴エリア */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-800 shadow'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-center">
            <div className="animate-pulse text-gray-500">検索中...</div>
          </div>
        )}
        {error && (
          <div className="flex justify-center">
            <div className="text-red-500">{error}</div>
          </div>
        )}
      </div>

      {/* 入力フォーム */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
        <div className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="検索したいキーワードを入力してください..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            className={`px-6 py-2 bg-blue-500 text-white rounded-lg transition-colors ${
              isLoading
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-blue-600'
            }`}
            disabled={isLoading}
          >
            送信
          </button>
        </div>
      </form>
    </div>
  )
}

export default Dashboard