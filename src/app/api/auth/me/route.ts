import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseSSRClient } from '@/lib/supabase-ssr'
import { getUserFromAuthHeader } from '@/lib/supabase-auth'

export async function GET(request: NextRequest) {
  const headerUser = await getUserFromAuthHeader(request)
  if (headerUser) {
    const out = NextResponse.json({ user: headerUser }, { status: 200 })
    out.headers.set('Cache-Control', 'no-store')
    return out
  }

  const response = NextResponse.next()
  const supabase = createSupabaseSSRClient(request, response)
  const { data, error } = await supabase.auth.getUser()

  const out = NextResponse.json({ user: error ? null : (data.user ?? null) }, { status: 200 })
  response.cookies.getAll().forEach(({ name, value, ...rest }) => {
    out.cookies.set(name, value, rest as any)
  })
  out.headers.set('Cache-Control', 'no-store')
  return out
}

