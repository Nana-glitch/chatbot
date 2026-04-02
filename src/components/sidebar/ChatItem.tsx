'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Chat } from '@/types'
import { useDeleteChat, useRenameChat } from '@/hooks/useChat'
import { useQueryClient } from '@tanstack/react-query'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { MoreHorizontalIcon, Trash2Icon, PencilIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ChatItem({ chat }: { chat: Chat }) {
  const router = useRouter()
  const params = useParams()
  const isActive = params?.chatId === chat.id
  const queryClient = useQueryClient()

  const [isRenaming, setIsRenaming] = useState(false)
  const [newTitle, setNewTitle] = useState(chat.title)

  const { mutateAsync: deleteChatAsync } = useDeleteChat()
  const { mutate: renameChat } = useRenameChat()

  async function handleDelete() {
    if (isActive) {
      const chats = (queryClient.getQueryData(['chats']) as Chat[] | undefined) ?? []
      const fallback = chats.find((c) => c.id !== chat.id)
      router.replace(fallback ? `/chat/${fallback.id}` : '/')
      setTimeout(() => {
        void deleteChatAsync(chat.id)
      }, 0)
      return
    }
    await deleteChatAsync(chat.id)
  }

  function handleRename() {
    if (newTitle.trim() && newTitle !== chat.title) {
      renameChat({ id: chat.id, title: newTitle.trim() })
    }
    setIsRenaming(false)
  }

  if (isRenaming) {
    return (
      <Input
        value={newTitle}
        onChange={(e) => setNewTitle(e.target.value)}
        onBlur={handleRename}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleRename()
          if (e.key === 'Escape') setIsRenaming(false)
        }}
        autoFocus
        className="h-8 text-sm"
      />
    )
  }

  return (
    <div
      className={cn(
        'group flex items-center gap-2 rounded-lg px-2 py-1.5 cursor-pointer transition-all duration-150 hover:bg-accent active:scale-[0.99]',
        isActive && 'bg-accent shadow-sm'
      )}
      onClick={() => router.push(`/chat/${chat.id}`)}
    >
      <span className="flex-1 truncate text-sm">{chat.title}</span>

      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex h-6 w-6 items-center justify-center rounded-md opacity-0 group-hover:opacity-100 shrink-0 hover:bg-muted transition-colors focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={(e) => e.stopPropagation()}
          aria-label="Chat actions"
        >
          <MoreHorizontalIcon size={14} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              setIsRenaming(true)
            }}
          >
            <PencilIcon size={14} className="mr-2" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              void handleDelete()
            }}
            className="text-destructive"
          >
            <Trash2Icon size={14} className="mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}