import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const schema = z.object({
  model: z.string().min(1),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
        model: z.string().optional(),
      })
    )
    .min(1),
})

async function getUserFromRequest(request: NextRequest) {
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {},
      },
    }
  )
  const { data } = await authClient.auth.getUser()
  return data.user
}

function titleFromFirstUserMessage(messages: { role: string; content: string }[]) {
  const first = messages.find((m) => m.role === 'user')?.content ?? 'New Chat'
  const firstLine = first.split('\n')[0]?.trim() ?? 'New Chat'
  const normalized = firstLine.replace(/\s+/g, ' ').trim()
  if (!normalized) return 'New Chat'
  return normalized.length > 48 ? `${normalized.slice(0, 48).trimEnd()}…` : normalized
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { model, messages } = schema.parse(body)

    const title = titleFromFirstUserMessage(messages)

    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .insert({ user_id: user.id, title, model })
      .select()
      .single()

    if (chatError) throw chatError

    const rows = messages
      .map((m) => ({
        chat_id: chat.id,
        role: m.role,
        content: m.content,
        model: m.role === 'assistant' ? (m.model ?? model) : null,
      }))
      .filter((m) => m.role === 'user' || (m.content && m.content.trim().length > 0))

    if (rows.length) {
      const { error: msgError } = await supabase.from('messages').insert(rows)
      if (msgError) throw msgError
    }

    return NextResponse.json({ chatId: chat.id }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

