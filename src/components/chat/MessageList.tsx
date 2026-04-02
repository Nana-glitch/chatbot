'use client'

import { useEffect, useRef } from 'react'
import { Message } from '@/types'
import { StreamingMessage } from './StreamingMessage'
import { FileIcon, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SimpleMarkdown } from './SimpleMarkdown'
import Image from 'next/image'

interface MessageListProps {
  messages: Message[]
  streamingText: string
  isStreaming: boolean
}

export function MessageList({
  messages,
  streamingText,
  isStreaming,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-2xl font-semibold">How can I help you?</p>
          <p className="text-sm text-muted-foreground">
            Start a conversation or upload a document
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto py-4">
        {messages.map((message, idx) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-3 px-4 py-3 motion-reduce:transform-none motion-reduce:animate-none animate-in fade-in slide-in-from-bottom-2 duration-200',
              message.role === 'user' && 'flex-row-reverse'
            )}
            style={{ animationDelay: `${Math.min(idx * 12, 120)}ms` }}
          >
            <div
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0',
                message.role === 'user'
                  ? 'bg-secondary text-secondary-foreground'
                  : 'bg-primary text-primary-foreground'
              )}
            >
              {message.role === 'user' ? 'U' : 'AI'}
            </div>

            <div
              className={cn(
                'flex-1 space-y-1',
                message.role === 'user' && 'flex flex-col items-end'
              )}
            >
              {message.attachments?.map((att) => (
                <div key={att.id} className="max-w-[80%]">
                  {att.type === 'image' && att.url ? (
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block overflow-hidden rounded-xl border bg-muted/40"
                      title={att.filename}
                    >
                      <Image
                        src={att.url}
                        alt={att.filename}
                        width={800}
                        height={320}
                        className="block max-h-[320px] w-auto object-contain"
                        unoptimized
                      />
                    </a>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/70 backdrop-blur rounded-lg px-2 py-1">
                      {att.type === 'image' ? (
                        <ImageIcon size={12} />
                      ) : (
                        <FileIcon size={12} />
                      )}
                      {att.filename}
                    </div>
                  )}
                </div>
              ))}

              <div
                className={cn(
                  'text-sm leading-relaxed whitespace-pre-wrap',
                  message.role === 'user' &&
                    'bg-secondary rounded-2xl rounded-tr-sm px-3 py-2 max-w-[80%] shadow-[0_12px_30px_rgba(20,30,60,0.10)] border border-border/60'
                )}
              >
                {message.role === 'assistant' ? (
                  <SimpleMarkdown content={message.content} />
                ) : (
                  message.content
                )}
              </div>

              {message.role === 'assistant' && message.model && (
                <p className="text-xs text-muted-foreground">{message.model}</p>
              )}
            </div>
          </div>
        ))}

        {isStreaming && <StreamingMessage text={streamingText} />}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}