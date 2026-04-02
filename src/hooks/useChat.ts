'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Chat } from '@/types'
import { getAuthToken } from '@/lib/auth-token'

async function fetchChats(): Promise<Chat[]> {
  const token = getAuthToken()
  const res = await fetch('/api/chats', {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  if (res.status === 401) throw new Error('Unauthorized')
  if (!res.ok) throw new Error('Failed to fetch chats')
  return res.json()
}

async function createChat(model: string): Promise<Chat> {
  const res = await fetch('/api/chats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model }),
  })
  if (!res.ok) throw new Error('Failed to create chat')
  return res.json()
}

async function deleteChat(id: string): Promise<void> {
  const res = await fetch(`/api/chats/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete chat')
}

async function renameChat(id: string, title: string): Promise<Chat> {
  const res = await fetch(`/api/chats/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  })
  if (!res.ok) throw new Error('Failed to rename chat')
  return res.json()
}

export function useChats(enabled: boolean) {
  return useQuery({
    queryKey: ['chats'],
    queryFn: fetchChats,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    enabled,
  })
}

export function useCreateChat() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createChat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] })
    },
  })
}

export function useDeleteChat() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteChat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] })
    },
  })
}

export function useRenameChat() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      renameChat(id, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] })
    },
  })
}