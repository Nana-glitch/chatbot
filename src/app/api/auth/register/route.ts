import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseSSRClient } from '@/lib/supabase-ssr'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = schema.parse(body)

    const response = NextResponse.json({ ok: true }, { status: 201 })
    const supabase = createSupabaseSSRClient(request, response)

    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}