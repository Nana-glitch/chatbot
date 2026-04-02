'use client'

import { useEffect, useState } from 'react'
import { useChats } from '@/hooks/useChat'
import { useRealtimeChats } from '@/hooks/useRealtimeChats'
import { useMe } from '@/hooks/useMe'
import { ChatItem } from './ChatItem'
import { NewChatButton } from './NewChatButton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { MessageSquareIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ThemeToggle'

interface SidebarProps {
  userId: string | null
  defaultModel: string
}

export function Sidebar({ userId, defaultModel }: SidebarProps) {
  const { data: me } = useMe()
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])

  const effectiveUserId = hydrated ? (userId ?? me?.user?.id ?? null) : userId

  const chatsQuery = useChats(!!effectiveUserId)
  const { data: chats, isLoading, isError, error, refetch } = chatsQuery

  useRealtimeChats(effectiveUserId)

  return (
    <div
      suppressHydrationWarning
      className="flex flex-col h-full w-64 border-r bg-sidebar shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_12px_30px_rgba(20,30,60,0.10)]"
    >
      <div className="p-3">
        <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
          <MessageSquareIcon size={18} />
          <span className="font-semibold text-sm">Chatbot</span>
        </div>
        {effectiveUserId && <NewChatButton model={defaultModel} />}
      </div>

      <Separator />

      <ScrollArea className="flex-1 px-2 py-2">
        {!effectiveUserId ? (
          <div className="px-2 py-8 text-center text-sm text-muted-foreground">
            Sign in to see your chats
          </div>
        ) : isLoading ? (
          <div className="space-y-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-8 rounded-lg bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="px-2 py-6 text-center text-sm text-muted-foreground space-y-2">
            <div>Failed to load chats</div>
            <div className="text-xs opacity-80">
              {error instanceof Error ? error.message : 'Unknown error'}
            </div>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        ) : chats?.length === 0 ? (
          <div className="px-2 py-8 text-center text-sm text-muted-foreground">
            No chats yet
          </div>
        ) : (
          <div className="space-y-0.5">
            {chats?.map((chat) => (
              <ChatItem key={chat.id} chat={chat} />
            ))}
          </div>
        )}
      </ScrollArea>

      <Separator />

      <div suppressHydrationWarning className="p-3 space-y-3">
        <div suppressHydrationWarning className="flex items-center justify-between">
          <div suppressHydrationWarning className="text-xs text-muted-foreground">
            {effectiveUserId ? 'Signed in' : 'Guest mode'}
          </div>
          <ThemeToggle className="h-9 w-9 rounded-xl" />
        </div>

        <div className="text-[11px] text-muted-foreground/70">
          <div className="space-y-1">
            <a
              className="block hover:text-muted-foreground transition-colors"
              href="https://t.me/nanami_chani"
              target="_blank"
              rel="noreferrer"
            >
              Telegram: @nanami_chani
            </a>
            <a
              className="block hover:text-muted-foreground transition-colors"
              href="https://www.linkedin.com/in/nastiamaloichik"
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn
            </a>
            <a
              className="block hover:text-muted-foreground transition-colors"
              href="mailto:nastiamaloichika@gmail.com"
            >
              Email: nastiamaloichika@gmail.com
            </a>
            <a
              className="block hover:text-muted-foreground transition-colors"
              href="https://github.com/Nana-glitch"
              target="_blank"
              rel="noreferrer"
            >
              GitHub: Nana-glitch
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}