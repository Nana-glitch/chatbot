import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function getUserFromAuthHeader(request: NextRequest) {
  const auth = request.headers.get('authorization') ?? request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.slice('Bearer '.length).trim()
  if (!token) return null
  const { data, error } = await supabasePublic.auth.getUser(token)
  if (error) return null
  return data.user ?? null
}

