'use client'

import { useQuery } from '@tanstack/react-query'
import { Message } from '@/types'

async function fetchMessages(chatId: string): Promise<Message[]> {
  const res = await fetch(`/api/messages/${chatId}`)
  if (!res.ok) throw new Error('Failed to fetch messages')
  return res.json()
}

export function useMessages(chatId: string | null) {
  return useQuery({
    queryKey: ['messages', chatId],
    queryFn: () => fetchMessages(chatId!),
    enabled: !!chatId,
  })
}