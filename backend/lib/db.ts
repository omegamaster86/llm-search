import mysql from 'mysql2/promise'
import Redis from 'ioredis'

// MySQL接続プール
export const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

// Redisクライアント
export const redis = new Redis(process.env.REDIS_URL as string) 