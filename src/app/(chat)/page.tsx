import { ChatWindow } from '@/components/chat/ChatWindow'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export default async function HomePage() {
  const user = await getUser()

  return (
    <div className="h-full">
      <ChatWindow chatId={null} isAnon={!user} />
    </div>
  )
}