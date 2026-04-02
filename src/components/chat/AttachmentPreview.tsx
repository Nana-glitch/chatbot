'use client'

import { FileIcon, ImageIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface PendingAttachment {
  id: string
  filename: string
  type: 'image' | 'pdf' | 'doc'
  url?: string
  extractedTextChars?: number
}

interface AttachmentPreviewProps {
  attachments: PendingAttachment[]
  onRemove: (id: string) => void
}

export function AttachmentPreview({
  attachments,
  onRemove,
}: AttachmentPreviewProps) {
  if (attachments.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 px-3 pt-2">
      {attachments.map((att) => (
        <div
          key={att.id}
          className="relative flex items-center gap-2 bg-muted/70 rounded-xl px-2 py-1.5 text-xs max-w-[220px] border"
        >
          {att.type === 'image' && att.url ? (
            <div className="h-10 w-10 overflow-hidden rounded-lg bg-background border shrink-0">
              <Image
                src={att.url}
                alt={att.filename}
                width={40}
                height={40}
                className="h-full w-full object-cover"
                unoptimized
              />
            </div>
          ) : att.type === 'image' ? (
            <ImageIcon size={14} className="shrink-0 text-blue-500" />
          ) : (
            <FileIcon size={14} className="shrink-0 text-orange-500" />
          )}
          <span className="truncate">{att.filename}</span>
          {att.type !== 'image' && typeof att.extractedTextChars === 'number' && (
            <span className="ml-1 shrink-0 text-[10px] text-muted-foreground">
              {att.extractedTextChars > 0 ? `${att.extractedTextChars} chars` : 'no text'}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 shrink-0 ml-1"
            onClick={() => onRemove(att.id)}
          >
            <XIcon size={10} />
          </Button>
        </div>
      ))}
    </div>
  )
}