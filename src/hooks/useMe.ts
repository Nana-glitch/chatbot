'use client'

import { useQuery } from '@tanstack/react-query'
import { getAuthToken } from '@/lib/auth-token'

type MeResponse = {
  user: { id: string; email?: string | null } | null
}

async function fetchMe(): Promise<MeResponse> {
  const token = getAuthToken()
  const res = await fetch('/api/auth/me', {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  if (!res.ok) throw new Error('Failed to fetch user')
  return res.json()
}

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: fetchMe,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: 3,
  })
}

