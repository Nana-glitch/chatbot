'use client'

import { useRouter } from 'next/navigation'
import { useCreateChat } from '@/hooks/useChat'
import { Button } from '@/components/ui/button'
import { PlusIcon } from 'lucide-react'

export function NewChatButton({ model }: { model: string }) {
  const router = useRouter()
  const { mutateAsync, isPending } = useCreateChat()

  async function handleClick() {
    const chat = await mutateAsync(model)
    router.push(`/chat/${chat.id}`)
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isPending}
      className="w-full justify-start gap-2"
      variant="ghost"
    >
      <PlusIcon size={16} />
      New Chat
    </Button>
  )
}