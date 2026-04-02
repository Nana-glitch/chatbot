'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMessages } from '@/hooks/useMessages'
import { useStreamMessage } from '@/hooks/useStreamMessage'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { ModelSelector } from './ModelSelector'
import { Button } from '@/components/ui/button'
import { AuthGateModal } from './AuthGateModal'
import { Message } from '@/types'
import { useQueryClient } from '@tanstack/react-query'

const GUEST_STORAGE_KEY = 'guest_chat_v1'

interface ChatWindowProps {
  chatId: string | null
  initialModel?: string
  isAnon?: boolean
}

export function ChatWindow({
  chatId,
  initialModel = 'deepseek/deepseek-chat',
  isAnon = false,
}: ChatWindowProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [model, setModel] = useState(initialModel)
  const [currentChatId, setCurrentChatId] = useState(chatId)
  const [authGateOpen, setAuthGateOpen] = useState(false)
  const [guestConfirmed, setGuestConfirmed] = useState(false)
  const [pendingSend, setPendingSend] = useState<{
    content: string
    attachmentIds: string[]
  } | null>(null)
  const [guestMessages, setGuestMessages] = useState<Message[]>([])

  const { data: dbMessages = [] } = useMessages(currentChatId)
  const { isStreaming, streamingText, error, sendMessage } = useStreamMessage()
  const messages = currentChatId ? dbMessages : guestMessages

  useEffect(() => {
    if (!isAnon) return
    if (currentChatId) return
    try {
      const raw = localStorage.getItem(GUEST_STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as {
        model?: string
        guestConfirmed?: boolean
        messages?: Message[]
      }
      if (parsed.model) setModel(parsed.model)
      if (typeof parsed.guestConfirmed === 'boolean') setGuestConfirmed(parsed.guestConfirmed)
      if (Array.isArray(parsed.messages)) setGuestMessages(parsed.messages)
    } catch {
    }
  }, [isAnon, currentChatId])

  useEffect(() => {
    if (!isAnon) return
    if (currentChatId) return
    try {
      localStorage.setItem(
        GUEST_STORAGE_KEY,
        JSON.stringify({ model, guestConfirmed, messages: guestMessages })
      )
    } catch {
    }
  }, [isAnon, currentChatId, model, guestConfirmed, guestMessages])

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      queryClient.removeQueries({ queryKey: ['chats'] })
      queryClient.removeQueries({ queryKey: ['messages'] })
      router.push('/')
      router.refresh()
    }
  }

  useEffect(() => {
    if (!isAnon) return
    if (!error) return
    if (error.includes('Anonymous limit reached')) {
      setAuthGateOpen(true)
    }
  }, [error, isAnon])

  function guestPush(role: 'user' | 'assistant', content: string, model?: string) {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    setGuestMessages((prev) => [
      ...prev,
      {
        id,
        chat_id: 'guest',
        role,
        content,
        model,
        created_at: now,
        attachments: [],
      },
    ])
    return id
  }

  function guestAppend(id: string, delta: string) {
    setGuestMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content: m.content + delta } : m))
    )
  }

  async function doSend(content: string, attachmentIds: string[]) {
    const isGuestChat = !currentChatId
    let assistantId: string | null = null

    if (isGuestChat) {
      guestPush('user', content)
      assistantId = guestPush('assistant', '', model)
    }

    let rollback: (() => void) | null = null
    if (!isGuestChat && currentChatId) {
      const key = ['messages', currentChatId] as const
      const prev = queryClient.getQueryData(key) as Message[] | undefined
      const optimistic: Message = {
        id: `optimistic_${crypto.randomUUID()}`,
        chat_id: currentChatId,
        role: 'user',
        content,
        created_at: new Date().toISOString(),
        attachments: [],
      }
      queryClient.setQueryData(key, [...(prev ?? []), optimistic])
      rollback = () => queryClient.setQueryData(key, prev ?? [])
    }

    const newChatId = await sendMessage({
      chatId: currentChatId ?? undefined,
      model,
      content,
      attachmentIds,
      onText: isGuestChat && assistantId ? (d) => guestAppend(assistantId!, d) : undefined,
      onError:
        isGuestChat && assistantId
          ? (msg) => {
              setGuestMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content || msg }
                    : m
                )
              )
            }
          : undefined,
    })
    if (!newChatId) rollback?.()

    if (newChatId && !currentChatId) {
      setCurrentChatId(newChatId)
      router.replace(`/chat/${newChatId}`)
    }
  }

  async function handleSend(content: string, attachmentIds: string[]) {
    if (isAnon && !guestConfirmed) {
      setPendingSend({ content, attachmentIds })
      setAuthGateOpen(true)
      return false
    }
    void doSend(content, attachmentIds)
    return true
  }

  return (
    <div className="flex flex-col h-full">
      <div
        suppressHydrationWarning
        className="flex items-center gap-2 px-4 py-2 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70 shadow-sm"
      >
        <ModelSelector value={model} onChange={setModel} />
        <div className="ml-auto flex items-center gap-2">
          {isAnon && (
            <>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                3 free questions as guest
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAuthGateOpen(true)}
              >
                Sign in
              </Button>
            </>
          )}
          {!isAnon && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
            >
              Sign out
            </Button>
          )}
        </div>
      </div>

      <MessageList
        messages={messages}
        streamingText={streamingText}
        isStreaming={isStreaming}
      />

      {error && (
        <div className="mx-4 mb-2 px-3 py-2 bg-destructive/10 text-destructive text-sm rounded-lg">
          {error}
        </div>
      )}

      <MessageInput
        onSend={handleSend}
        isStreaming={isStreaming}
        disabled={false}
        attachmentsDisabled={isAnon}
        onAttachmentsDisabledClick={() => setAuthGateOpen(true)}
      />

      <AuthGateModal
        open={authGateOpen}
        onOpenChange={setAuthGateOpen}
        onContinueAsGuest={
          isAnon
            ? () => {
                setGuestConfirmed(true)
                const p = pendingSend
                setPendingSend(null)
                if (p) void doSend(p.content, p.attachmentIds)
              }
            : undefined
        }
      />
    </div>
  )
}