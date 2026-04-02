import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseSSRClient } from '@/lib/supabase-ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const publicPaths = [
    '/',
    '/login',
    '/register',
    '/api/auth/me',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/logout',
    '/api/messages',
  ]

  const isPublicPath = publicPaths.some((path) =>
    pathname.startsWith(path)
  )

  if (isPublicPath) {
    return NextResponse.next()
  }

  const response = NextResponse.next()
  const supabase = createSupabaseSSRClient(request, response)

  const { data: { user } } = await supabase.auth.getUser()

  // Защищённые API роуты
  if (pathname.startsWith('/api/') && !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Редирект на логин для страниц
  if (!user && !pathname.startsWith('/api/')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Уже залогинен — не пускаем на auth страницы
  if (user && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
}