import { Client } from '@notionhq/client'
import { google } from 'googleapis'
import { OpenAI } from 'langchain/llms/openai'
import { ChatOpenAI } from 'langchain/chat_models/openai'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { OpenAIEmbeddings } from 'langchain/embeddings/openai'

// Notion クライアント
export const notion = new Client({
  auth: process.env.NOTION_API_KEY,
})

// Google Drive クライアント
const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
})

export const drive = google.drive({ version: 'v3', auth })

// LangChain設定
export const model = new ChatOpenAI({
  modelName: 'gpt-4',
  temperature: 0,
  openAIApiKey: process.env.OPENAI_API_KEY,
})

export const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
})

export const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
}) 