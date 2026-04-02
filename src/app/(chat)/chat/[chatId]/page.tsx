import { ChatWindow } from '@/components/chat/ChatWindow'

export default async function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>
}) {
  const { chatId } = await params

  return (
    <div className="h-full">
      <ChatWindow chatId={chatId} />
    </div>
  )
}