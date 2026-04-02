export type Role = 'user' | 'assistant'

export type LLMProvider = 'openrouter'

export type AttachmentType = 'image' | 'pdf' | 'doc'

export interface User {
  id: string
  email: string
}

export interface Chat {
  id: string
  user_id: string
  title: string
  model: string
  created_at: string
  updated_at: string
}

export interface Attachment {
  id: string
  message_id: string
  user_id: string
  type: AttachmentType
  storage_path: string
  filename: string
  size_bytes: number
  url?: string | null
  extracted_text?: string
  created_at: string
}

export interface Message {
  id: string
  chat_id: string
  role: Role
  content: string
  model?: string
  created_at: string
  attachments?: Attachment[]
}

export interface LLMMessage {
  role: Role
  content: string
}

export const LLM_MODELS = {
  openrouter: [
    { id: 'deepseek/deepseek-chat', name: 'DeepSeek' },
    { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1' },
    { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B' },
    { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B' },
    { id: 'google/gemma-2-27b-it', name: 'Gemma 2 27B' },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o mini' },
  ],
} as const