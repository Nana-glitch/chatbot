import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createServerClient } from '@supabase/ssr'
import { createLLMStream } from '@/lib/llm'
import { generateChatTitleOpenRouter } from '@/lib/llm/openrouter'
import { z } from 'zod'

const ANON_LIMIT = 3
const ANON_COOKIE = 'anon_questions'

const schema = z.object({
  chatId: z.string().uuid().optional(),
  model: z.string(),
  content: z.string().min(1),
  attachmentIds: z.array(z.string().uuid()).optional(),
})

async function getUserFromRequest(request: NextRequest) {
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll() {},
      },
    }
  )
  const { data: { user } } = await authClient.auth.getUser()
  return user
}

function extractProviderError(error: unknown): { status?: number; message: string } {
  const status =
    (error as any)?.status ??
    (error as any)?.response?.status ??
    (error as any)?.error?.status

  const message =
    (error as any)?.error?.message ??
    (error as any)?.message ??
    (status ? `Provider error (${status})` : 'Provider error')

  return { status, message: String(message) }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)

    let anonNextCount: number | null = null
    if (!user) {
      const current = Number.parseInt(request.cookies.get(ANON_COOKIE)?.value ?? '0', 10) || 0
      if (current >= ANON_LIMIT) {
        return NextResponse.json(
          { error: 'Anonymous limit reached. Please sign up.' },
          { status: 403 }
        )
      }
      anonNextCount = current + 1
    }

    const body = await request.json()
    const { chatId, model, content, attachmentIds } = schema.parse(body)

    let currentChatId = chatId
    let createdChat: { id: string } | null = null

    if (!currentChatId && user) {
      const { data: newChat, error } = await supabase
        .from('chats')
        .insert({ user_id: user.id, title: 'New Chat', model })
        .select()
        .single()

      if (error) throw error
      currentChatId = newChat.id
      createdChat = { id: newChat.id }
    }

    let attachmentContext = ''
    if (attachmentIds?.length && currentChatId) {
      const { data: attachments } = await supabase
        .from('attachments')
        .select('type, extracted_text, filename')
        .in('id', attachmentIds)
        .eq('user_id', user?.id ?? '')

      if (attachments?.length) {
        const MAX_TOTAL = 12000
        const MAX_PER_FILE = 6000
        let used = 0

        const parts: string[] = []
        for (const a of attachments) {
          if (used >= MAX_TOTAL) break

          const filename = String((a as any)?.filename ?? 'file')
          const type = String((a as any)?.type ?? '')
          const textRaw = typeof (a as any)?.extracted_text === 'string' ? (a as any).extracted_text : ''
          const text = textRaw.trim()

          if (!text) {
            parts.push(`File: ${filename}\n(Type: ${type})\n(No extractable text)`)
            used += Math.min(64, MAX_TOTAL - used)
            continue
          }

          const slice = text.length > MAX_PER_FILE ? `${text.slice(0, MAX_PER_FILE)}\n...[truncated]` : text
          const remaining = MAX_TOTAL - used
          const final = slice.length > remaining ? slice.slice(0, remaining) : slice
          parts.push(`File: ${filename}\n${final}`)
          used += final.length
        }

        attachmentContext = parts.join('\n\n---\n\n')
      }
    }

    let userMessageId: string | null = null
    if (currentChatId) {
      const { data: inserted, error: insertError } = await supabase
        .from('messages')
        .insert({
          chat_id: currentChatId,
          role: 'user',
          content,
        })
        .select('id')
        .single()

      if (insertError) throw insertError
      userMessageId = inserted?.id ?? null

      if (attachmentIds?.length && userMessageId && user) {
        const { data: owned, error: ownedErr } = await supabase
          .from('attachments')
          .select('id')
          .in('id', attachmentIds)
          .eq('user_id', user.id)

        if (ownedErr) throw ownedErr
        const ownedIds = (owned ?? []).map((a) => a.id)

        const { data: updated1, error: updErr1 } = await supabase
          .from('attachments')
          .update({ message_id: userMessageId })
          .in('id', ownedIds)
          .select('id')

        if (updErr1) throw updErr1

        if (ownedIds.length === 0) {
          return NextResponse.json(
            { error: 'No owned attachments to attach' },
            { status: 400 }
          )
        }
      }

      await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', currentChatId)
    }

    let history: { role: 'user' | 'assistant'; content: string }[] = []
    if (currentChatId) {
      const { data: messages } = await supabase
        .from('messages')
        .select('role, content')
        .eq('chat_id', currentChatId)
        .order('created_at', { ascending: true })

      history = (messages ?? []) as typeof history
    } else {
      history = [{ role: 'user', content }]
    }

    const systemPrompt = attachmentContext
      ? `You are a helpful assistant.\n\n` +
        `The user attached files. Use the file context below to answer and, when relevant, cite the filename.\n\n` +
        `File context:\n${attachmentContext}`
      : undefined

    let llmStream: ReadableStream<string>
    try {
      llmStream = await createLLMStream(model, history, systemPrompt)
    } catch (error) {
      const { status, message } = extractProviderError(error)
      return NextResponse.json(
        {
          error:
            `LLM request blocked/forbidden.\n` +
            `provider_status=${status ?? 'unknown'}\n` +
            `message=${message}\n\n` +
            `Tip: проверь, что у провайдера включён биллинг/кредиты и есть доступ к выбранной модели. ` +
            `Для Gemini ещё нужен GOOGLE_AI_API_KEY (сейчас у тебя он пустой).`,
        },
        { status: 502 }
      )
    }

    const encoder = new TextEncoder()
    let fullResponse = ''

    const stream = new ReadableStream({
      async start(controller) {
        const reader = llmStream.getReader()
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            fullResponse += value
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: value })}\n\n`))
          }

          if (currentChatId) {
            await supabase.from('messages').insert({
              chat_id: currentChatId,
              role: 'assistant',
              content: fullResponse,
              model,
            })

            if (createdChat && fullResponse.trim().length > 0) {
              try {
                const title = await generateChatTitleOpenRouter({
                  model,
                  userText: content,
                  assistantText: fullResponse,
                })
                const safe =
                  title.length > 64 ? `${title.slice(0, 64).trimEnd()}…` : title
                if (safe) {
                  await supabase
                    .from('chats')
                    .update({ title: safe, updated_at: new Date().toISOString() })
                    .eq('id', createdChat.id)
                }
              } catch {
              }
            }
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true, chatId: currentChatId })}\n\n`)
          )
          controller.close()
        } catch (error) {
          const { status, message } = extractProviderError(error)
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                error: `LLM stream failed: status=${status ?? 'unknown'} message=${message}`,
                done: true,
                chatId: currentChatId,
              })}\n\n`
            )
          )
          controller.close()
        }
      },
    })

    const response = new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
    if (anonNextCount !== null) {
      response.cookies.set(ANON_COOKIE, String(anonNextCount), {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      })
    }
    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}