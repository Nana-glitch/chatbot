'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { setAuthToken } from '@/lib/auth-token'
import { MessageSquareIcon } from 'lucide-react'

export default function LoginPage() {
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function importGuestHistoryIfAny(): Promise<string | null> {
    try {
      const raw = localStorage.getItem('guest_chat_v1')
      if (!raw) return null
      const parsed = JSON.parse(raw) as {
        model?: string
        messages?: { role: 'user' | 'assistant'; content: string; model?: string }[]
      }
      if (!parsed?.messages?.length || !parsed.model) return null

      const res = await fetch('/api/chats/import-guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: parsed.model, messages: parsed.messages }),
      })
      if (!res.ok) return null
      const data = await res.json()
      if (data?.chatId) {
        localStorage.removeItem('guest_chat_v1')
        return String(data.chatId)
      }
      return null
    } catch {
      return null
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Login failed')
        return
      }

      const token = res.headers.get('x-sb-access-token')
      if (token) setAuthToken(token)

      queryClient.removeQueries({ queryKey: ['chats'] })
      await queryClient.invalidateQueries({ queryKey: ['chats'] })
      await queryClient.refetchQueries({ queryKey: ['chats'] })

      const importedChatId = await importGuestHistoryIfAny()
      window.location.assign(importedChatId ? `/chat/${importedChatId}` : '/')
    } catch {
      setError('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground inline-flex items-center justify-center shadow-sm">
            <MessageSquareIcon size={18} />
          </div>
          <span className="font-medium text-foreground">Chatbot</span>
        </div>
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your account
        </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <p className="text-sm text-center text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-foreground underline underline-offset-4 hover:opacity-90 transition-opacity">
          Sign up
        </Link>
      </p>
    </div>
  )
}