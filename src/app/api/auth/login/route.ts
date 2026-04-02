import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseSSRClient } from '@/lib/supabase-ssr'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = schema.parse(body)

    const response = NextResponse.json({ ok: true })
    const supabase = createSupabaseSSRClient(request, response)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    response.cookies.delete('anon_questions')

    if (data.session?.access_token) {
      response.headers.set('x-sb-access-token', data.session.access_token)
    }
    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}