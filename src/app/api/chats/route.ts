import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createSupabaseSSRClient } from '@/lib/supabase-ssr'
import { getUserFromAuthHeader } from '@/lib/supabase-auth'

async function getUserFromRequest(request: NextRequest) {
  const headerUser = await getUserFromAuthHeader(request)
  if (headerUser) return headerUser
  const response = NextResponse.next()
  const authClient = createSupabaseSSRClient(request, response)
  const { data: { user } } = await authClient.auth.getUser()
  return user
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) throw error

    const res = NextResponse.json(data)
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const model = body.model ?? 'claude-sonnet-4-20250514'

    const { data, error } = await supabase
      .from('chats')
      .insert({ user_id: user.id, title: 'New Chat', model })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}