'use client'

import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

interface StreamOptions {
  chatId?: string
  model: string
  content: string
  attachmentIds?: string[]
  onText?: (delta: string) => void
  onError?: (message: string) => void
  onDone?: (chatId: string | null) => void
}

interface StreamState {
  isStreaming: boolean
  streamingText: string
  error: string | null
}

export function useStreamMessage() {
  const queryClient = useQueryClient()
  const [state, setState] = useState<StreamState>({
    isStreaming: false,
    streamingText: '',
    error: null,
  })

  const sendMessage = useCallback(
    async (options: StreamOptions): Promise<string | null> => {
      setState({ isStreaming: true, streamingText: '', error: null })

      try {
        const res = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(options),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error ?? 'Failed to send message')
        }

        const reader = res.body!.getReader()
        const decoder = new TextDecoder()
        let newChatId: string | null = options.chatId ?? null

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const json = JSON.parse(line.slice(6))

            if (json.error) {
              throw new Error(String(json.error))
            }

            if (json.text) {
              options.onText?.(String(json.text))
              setState((prev) => ({
                ...prev,
                streamingText: prev.streamingText + json.text,
              }))
            }

            if (json.done) {
              newChatId = json.chatId ?? newChatId
            }
          }
        }

        queryClient.invalidateQueries({ queryKey: ['chats'] })
        if (newChatId) {
          queryClient.invalidateQueries({
            queryKey: ['messages', newChatId],
          })
        }

        setState({ isStreaming: false, streamingText: '', error: null })
        options.onDone?.(newChatId)
        return newChatId
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error'
        setState({ isStreaming: false, streamingText: '', error: message })
        options.onError?.(message)
        return null
      }
    },
    [queryClient]
  )

  return { ...state, sendMessage }
}