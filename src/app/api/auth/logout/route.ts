import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseSSRClient } from '@/lib/supabase-ssr'

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true })
  const supabase = createSupabaseSSRClient(request, response)

  await supabase.auth.signOut()
  return response
}