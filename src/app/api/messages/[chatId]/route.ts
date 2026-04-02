import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createServerClient } from '@supabase/ssr'
import { getSignedUrl } from '@/lib/storage'

async function getUserFromRequest(request: NextRequest) {
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll() {},
      },
    }
  )
  const { data: { user } } = await authClient.auth.getUser()
  return user
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chatId } = await params

    const { data: chat } = await supabase
      .from('chats')
      .select('id')
      .eq('id', chatId)
      .eq('user_id', user.id)
      .single()

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*, attachments(*)')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })

    if (error) throw error

    const withUrls = await Promise.all(
      (data ?? []).map(async (m: any) => {
        const atts = Array.isArray(m.attachments) ? m.attachments : []
        const enriched = await Promise.all(
          atts.map(async (a: any) => {
            if (a?.type === 'image' && a?.storage_path) {
              try {
                const url = await getSignedUrl(String(a.storage_path))
                return { ...a, url }
              } catch {
                return { ...a, url: null }
              }
            }
            return { ...a, url: null }
          })
        )
        return { ...m, attachments: enriched }
      })
    )

    return NextResponse.json(withUrls)
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}