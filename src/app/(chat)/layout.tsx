import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Sidebar } from '@/components/sidebar/Sidebar'

async function getUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {},
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  return (
    <div className="flex h-screen overflow-hidden bg-muted/40">
      <Sidebar
        userId={user?.id ?? null}
        defaultModel="deepseek/deepseek-chat"
      />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}